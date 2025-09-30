# coding: utf8
import io
import os
import sys
import json
import shutil

from docx2pdf import convert
from fpdf import FPDF, HTMLMixin
from fpdf.fonts import FontFace
from fpdf.enums import XPos, YPos
from PyPDF2 import PdfReader, PdfWriter, PdfMerger
from arabic_reshaper import reshape
from bidi.algorithm import get_display

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

PIPE_PATH = "\\\\.\\pipe\\pdfpipe"

class MyFPDF(FPDF, HTMLMixin):
  pass

def docx_convert(doc_path, pdf_dir):
  doc_file = os.path.basename(doc_path)
  pre, ext = os.path.splitext(doc_file)
  pdf_file = pre + ".pdf"
  
  pdf_path = os.path.join(pdf_dir, pdf_file)

  convert(doc_path, pdf_path)
  return pdf_path

def page_number(index, draft=False):
  packet = io.BytesIO()
  can = canvas.Canvas(packet, pagesize=A4)
  page_width, page_height = A4
  can.drawString(280, 20, "- " + str(index) + " -")
  if draft:
    draft_path = os.path.join(base_dir, "assets", "draft.png")
    can.drawImage(draft_path, x=0, y=0, width=page_width, height=page_height, mask='auto')
  can.save()
  packet.seek(0)
  return PdfReader(packet).pages[0]

def rtl_line(line, max_len=27):
  lines=[]
  line_num=-1
  char_num=max_len
  for word in line.split():
    if char_num + len(word) < max_len:
      lines[line_num].append(word)
      char_num += len(word)
    else:
      line_num += 1
      lines.append([word])
      char_num = len(word)
  new_line = ""
  for line in lines:
    new_line += " " + " ".join(line) + "\n"
  new_line = new_line[:-1]
  return get_display(reshape(new_line))

def generate(fifo, docs):
  
  def send_message(message):
    if fifo:
      status = {'message': message, 'phase': "converting", 'step': 1, 'total': 5}
      status_str = json.dumps(status)
      os.write(fifo, bytes(status_str, 'utf-8'))

  if "output" not in docs or not isinstance(docs["output"], dict) or "path" not in docs["output"] or not docs["output"]["path"].endswith(".pdf"):
    return {"status": "error", "msg": "קובץ הפלט לא תקין"}

  import tempfile
  temp_dir = tempfile.mkdtemp(prefix="dindocs_")
  result = {"status": "success"}

  pdfs = []
  current_page = 0

  main_path = docs["main"]
  if main_path.endswith(".docx"):
    send_message("ממיר מסמך מרכזי לקובץ PDF")
    main_path = docx_convert(main_path, temp_dir)
  pdfs.append(main_path)
  with open(main_path, "rb") as main_file:
    read_pdf = PdfReader(main_file)
    current_page = len(read_pdf.pages) + 3

  if len(docs["attachments"]) > 0:
    toc = []
    toc_path = os.path.join(temp_dir, "toc.pdf")
    pdfs.append(toc_path)

    appx_num = 0
    #os.write(fifo, bytes("מייצר דף מקדים לנספחים", 'utf-8'))
    for attachment in docs["attachments"]:
      pdf = FPDF(orientation="P", unit="mm", format="A4")
      pdf.set_top_margin(40)
      pdf.add_font('David', '', os.path.join(base_dir, "fonts", "David.ttf"), uni=True)
      pdf.add_page()

      appx_num += 1
      appx_title = "נספח " + str(appx_num)
      titles = [ rtl_line(appx_title), rtl_line(attachment["title"]), rtl_line("עמ' " + str(current_page)) ]

      pdf.set_font("David", "U", size=36)
      pdf.multi_cell(0, 14, txt=rtl_line(appx_title), border=0, align="C")
      pdf.set_font("David", size=36)
      pdf.cell(0, 15, txt="", ln=1, border=0, align="C")
      pdf.multi_cell(0, 14, txt=rtl_line(attachment["title"]), border=0, align="C")
      pdf.cell(0, 45, txt="", ln=1, border=0, align="C")
      pdf.multi_cell(0, 14, txt=rtl_line("עמ' " + str(current_page)), border=0, align="C")

      attachment_filename = os.path.splitext(attachment["path"])[0] + ".pdf"
      attachment_filename = "_" + os.path.basename(attachment_filename)
      appx_path = os.path.join(temp_dir, attachment_filename)
      pdf.output(appx_path)
      #pdf.close()

      pdfs.append(appx_path)
      appx_path = attachment["path"]
      if attachment["path"].endswith(".docx"):
        send_message("ממיר נספח {} לקובץ PDF".format(appx_num))
        appx_path = docx_convert(appx_path, temp_dir)
      pdfs.append(appx_path)

      toc.append([str(current_page), rtl_line(attachment["title"], 68), str(appx_num)])
      with open(appx_path, "rb") as app_file:
        read_pdf = PdfReader(app_file)
        current_page = current_page + len(read_pdf.pages) + 1

    #os.write(fifo, bytes("מייצר תוכן עיניינים לנספחים", 'utf-8'))
    pdf = MyFPDF(orientation="P", unit="mm", format="A4")
    pdf.set_top_margin(20)
    pdf.set_left_margin(18)
    pdf.add_font('David', '', os.path.join(base_dir, "fonts", "David.ttf"))
    pdf.add_font('Davidbd', '', os.path.join(base_dir, "fonts", "davidbd.ttf"))
    pdf.add_page()
    pdf.set_font("Davidbd", "U", size=18)
    pdf.cell(0, 10, txt="תוכן עניינים"[::-1], new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
    pdf.cell(0, 7, txt="", border=0, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
    pdf.set_font("Davidbd", size=14)
    headers = ["עמ'", "שם הנספח", "מס'"]
    table_data = [[get_display(reshape(headers[0])), get_display(reshape(headers[1])), get_display(reshape(headers[2]))]]
    with pdf.table(table_data, first_row_as_headings=False, col_widths=(7, 86, 7), text_align="CENTER") as table:
      pass
    pdf.set_font("David", size=12)
    with pdf.table(toc, first_row_as_headings=False, line_height=2*pdf.font_size, col_widths=(7, 86, 7), text_align=("CENTER", "RIGHT", "CENTER")) as table:
      pass    
    pdf.output(toc_path)
  
  merger = PdfMerger()
  total_pdfs = len(pdfs)
  for pdf_num in range(total_pdfs):
    if (pdf_num%2==0):
      send_message("מאחד קבצים למסמך אחד - {}/{}".format(pdf_num//2+1, total_pdfs//2))
    merger.append(pdfs[pdf_num])
  send_message("שומר את המסמך המאוחד לקובץ")

  output_path = docs["output"]["path"]
  output_filename = os.path.basename(output_path)
  merged_file = os.path.join(temp_dir, output_filename)
  merger.write(merged_file)

  try:
    infile = PdfReader(merged_file)
    outfile = PdfWriter()
    total_pages = len(infile.pages)
    draft = "draft" in docs and docs["draft"]==True
    for page_num in range(total_pages):
      send_message("ממספר את העמודים במסמך - {}/{}".format(page_num+1, total_pages))
      page = infile.pages[page_num]
      page.merge_page(page_number(page_num+1, draft))
      outfile.add_page(page)
    send_message("שומר את המסמך לקובץ \"{}\"".format(output_filename))
    with open(output_path, "wb") as fp:
      outfile.write(fp)
      result["output"] = docs["output"]
  except PermissionError:
    result = {"status": "error", "msg": "לא ניתן לייצר את הקובץ, ייתכן שכבר פתוח או שאין הרשאת כתיבה לתיקייה"}
  finally:
    merger.close()

  send_message("מוחק קבצים זמניים")
  shutil.rmtree(temp_dir)
  return result;

if __name__ == "__main__":
  try:
    base_dir = getattr(sys, '_MEIPASS', os.getcwd())
    fifo = os.open(PIPE_PATH, os.O_WRONLY)
    #fifo=None
    docs = json.loads(sys.argv[1])
    #docs = json.loads(r'{"main":"C:\\din.docs\\temp.pdf","attachments":[],"output":{"path":"C:\\Users\\Moshe\\Downloads\\test.pdf"},"isDraft":true}')
    result = generate(fifo, docs)
    if fifo: os.close(fifo)
    print(json.dumps(result))
  except Exception:
    import traceback
    traceback.print_exc()



