# coding: utf8
import io
import os
import sys
import json
import shutil
import datetime
import tempfile

import win32com.client
from fpdf import FPDF, HTMLMixin
from fpdf.fonts import FontFace
from fpdf.enums import XPos, YPos
from pypdf import PdfReader, PdfWriter
from arabic_reshaper import reshape
from bidi_display import get_display
#from bidi.algorithm import get_display

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

PIPE_PATH = "\\\\.\\pipe\\pdfpipe"

WD_FORMAT_PDF = 17
WD_DO_NOT_SAVE_CHANGES = 0
WD_ALERTS_NONE = 0

class MyFPDF(FPDF, HTMLMixin):
  pass

class DocxConverter:
  """Convert DOCX files to PDF using a private, hidden Word instance.

  win32com's Dispatch attaches to the user's running Word, so closing documents
  or quitting it would close the user's documents too. DispatchEx always starts
  a separate WINWORD.EXE, which is the only instance we close."""

  def __init__(self, work_dir):
    self.work_dir = work_dir
    self.word = None
    self.count = 0

  def convert(self, doc_path):
    """Convert a copy of doc_path to PDF and return the PDF path"""
    self.count += 1
    pre = os.path.splitext(os.path.basename(doc_path))[0]
    # Unique names - main and attachments from different folders may share a file name
    docx_copy = os.path.join(self.work_dir, "{}_{}.docx".format(self.count, pre))
    pdf_path = os.path.join(self.work_dir, "{}_{}.pdf".format(self.count, pre))

    # Work on a copy, so a document open (and locked) in the user's Word is never touched
    try:
      shutil.copyfile(doc_path, docx_copy)
    except OSError:
      raise Exception("לא ניתן לקרוא את הקובץ " + os.path.basename(doc_path))

    if self.word is None:
      self.word = win32com.client.DispatchEx("Word.Application")
      self.word.Visible = False
      self.word.DisplayAlerts = WD_ALERTS_NONE

    doc = self.word.Documents.Open(docx_copy, ConfirmConversions=False, ReadOnly=True, AddToRecentFiles=False, Visible=False)
    try:
      doc.SaveAs(pdf_path, FileFormat=WD_FORMAT_PDF)
    finally:
      doc.Close(WD_DO_NOT_SAVE_CHANGES)
    return pdf_path

  def close(self):
    """Quit the private Word instance, if it was started"""
    if self.word is not None:
      try:
        self.word.Quit(WD_DO_NOT_SAVE_CHANGES)
      except Exception:
        pass  # Word may already be gone, nothing left to clean up
      self.word = None

def page_number(index, draft=False):
  """Create a page with page number and optional draft watermark"""
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

def attachment_index_overlay(index):
  """Create a page overlay with attachment index number at top left"""
  packet = io.BytesIO()
  can = canvas.Canvas(packet, pagesize=A4)
  page_width, page_height = A4
  can.setFont("Helvetica-Bold", 75)
  can.drawString(30, page_height - 80, str(index))  # Top left position
  can.save()
  packet.seek(0)
  return PdfReader(packet).pages[0]

def rtl_line(line, max_len=27):
  """Process RTL text line with word wrapping and BiDi display"""
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


def file_error(owner, reason):
  """Build an error message for a file in the merge list (owner: "main", "toc" or file number in the list)"""
  if owner == "main":
    return "המסמך הראשי לא תקין - " + reason
  if owner == "toc":
    return "תוכן העניינים לא תקין - " + reason
  return "קובץ {} לא תקין - {}".format(owner, reason)

def send_message(fifo, message, phase, step, total):
  """Send progress message through FIFO pipe"""
  if fifo:
    status = {'message': message, 'phase': phase, 'step': step, 'total': total}
    status_str = json.dumps(status)
    os.write(fifo, bytes(status_str, 'utf-8'))
  
def generate(fifo, docs):
  """Main PDF generation function"""
  if "output" not in docs or not isinstance(docs["output"], dict) or "path" not in docs["output"] or not docs["output"]["path"].endswith(".pdf"):
    return {"status": "error", "msg": "קובץ הפלט לא תקין"}

  # Create temp directory in user's temp folder or system temp
  temp_dir = tempfile.mkdtemp(prefix="dindocs_")
  result = {"status": "success"}

  pdfs = []
  pdf_owners = []  # Parallel to pdfs: "main", "toc" or the file number in the attachments list
  current_page = 0
  merger = PdfWriter()
  converter = DocxConverter(temp_dir)

  docx_count = sum(1 for attachment in docs["attachments"] if attachment["path"].endswith(".docx")) + int(docs["main"].endswith(".docx"))
  total_steps = docx_count + 4
  current_step = 0

  def send_message(message, phase, step):
    if fifo:
      status = {'message': message, 'phase': phase, 'step': step, 'total': total_steps}
      status_str = json.dumps(status)
      os.write(fifo, bytes(status_str, 'utf-8'))

  try:
    main_path = docs["main"]
    if main_path.endswith(".docx"):
      current_step += 1
      send_message("ממיר את המסמך הראשי לקובץ PDF", "converting", current_step)
      main_path = converter.convert(main_path)
    pdfs.append(main_path)
    pdf_owners.append("main")
    
    # Validate main PDF file
    try:
      with open(main_path, "rb") as main_file:
        read_pdf = PdfReader(main_file, strict=False)
        current_page = len(read_pdf.pages) + 1  # Next page after main
    except Exception as ex:
      return {"status": "error", "msg": "המסמך הראשי לא תקין - " + str(ex)}

    attachment_first_pages = {}  # Maps page_number -> toc_appx_num (for index overlay)
    
    if len(docs["attachments"]) > 0:
      toc = []
      toc_path = os.path.join(temp_dir, "toc.pdf")
      toc_inserted = False
      
      # Check if there are any non-ignoreTOC attachments (need TOC)
      has_toc_attachments = any(not att.get("ignoreTOC", False) for att in docs["attachments"])

      # Single pass through all attachments
      for appx_num, attachment in enumerate(docs["attachments"], start=1):
        is_ignore_toc = attachment.get("ignoreTOC", False)
        
        # Insert TOC before the first non-ignoreTOC attachment
        if not toc_inserted and not is_ignore_toc and has_toc_attachments:
          pdfs.append(toc_path)
          pdf_owners.append("toc")
          current_page += 1  # +1 for TOC page
          toc_inserted = True
        
        if not is_ignore_toc:
          current_page += 1  # +1 for cover page (increment before creating cover)
          
          # Create cover page for non-ignoreTOC attachment
          pdf = FPDF(orientation="P", unit="mm", format="A4")
          pdf.set_top_margin(40)
          pdf.add_font('David', '', os.path.join(base_dir, "fonts", "David.ttf"), uni=True)
          pdf.add_page()

          toc_appx_num = len(toc) + 1
          appx_title = "נספח " + str(toc_appx_num)

          pdf.set_font("David", "U", size=36)
          pdf.multi_cell(0, 14, txt=rtl_line(appx_title), border=0, align="C")
          pdf.set_font("David", size=36)
          pdf.cell(0, 15, txt="", ln=1, border=0, align="C")
          pdf.multi_cell(0, 14, txt=rtl_line(attachment["title"]), border=0, align="C")
          pdf.cell(0, 45, txt="", ln=1, border=0, align="C")
          pdf.multi_cell(0, 14, txt=rtl_line("עמ' " + str(current_page)), border=0, align="C")

          attachment_filename = os.path.splitext(attachment["path"])[0] + ".pdf"
          attachment_filename = "_" + os.path.basename(attachment_filename)
          cover_path = os.path.join(temp_dir, attachment_filename)
          pdf.output(cover_path)

          pdfs.append(cover_path)
          pdf_owners.append(appx_num)

        appx_path = attachment["path"]
        if attachment["path"].endswith(".docx"):
          current_step += 1
          send_message("ממיר את קובץ {} ל-PDF".format(appx_num), "converting", current_step)
          appx_path = converter.convert(appx_path)
        pdfs.append(appx_path)
        pdf_owners.append(appx_num)

        # Validate attachment PDF file and update page count
        try:
          with open(appx_path, "rb") as app_file:
            read_pdf = PdfReader(app_file, strict=False)
            if not is_ignore_toc:
              # Add to TOC only for non-ignoreTOC attachments
              toc_appx_num = len(toc) + 1
              # Track first page of attachment for index overlay
              attachment_first_pages[current_page] = toc_appx_num
              toc.append([str(current_page), rtl_line(attachment["title"], 68), str(toc_appx_num)])
            current_page += len(read_pdf.pages)
        except Exception as ex:
          return {"status": "error", "msg": file_error(appx_num, str(ex))}

      # Generate TOC PDF if there are TOC entries
      if has_toc_attachments and len(toc) > 0:
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
        with pdf.table(toc, first_row_as_headings=False, line_height=pdf.font_size, col_widths=(7, 86, 7), text_align=("CENTER", "RIGHT", "CENTER"), padding=2) as table:
          pass    
        pdf.output(toc_path)
  
    current_step += 1
    total_pdfs = len(pdfs)
    try:
      for pdf_num in range(total_pdfs):
        if (pdf_num%2==0):
          send_message("מאחד קבצים למסמך אחד - {}/{}".format(pdf_num//2+1, total_pdfs//2), "merging", current_step)
        merger.append(pdfs[pdf_num])
    except Exception as ex:
      return {"status": "error", "msg": file_error(pdf_owners[pdf_num], "לא ניתן לאחד את הקובץ")}
    
    current_step += 1
    send_message("שומר את המסמך המאוחד לקובץ", "merging", current_step)

    output_path = docs["output"]["path"]
    output_filename = os.path.basename(output_path)
    merged_file = os.path.join(temp_dir, output_filename)
    
    try:
      merger.write(merged_file)
    except Exception as ex:
      # The merge.write() failed - write each PDF on its own to find the one that caused it
      for pdf_path, owner in zip(pdfs, pdf_owners):
        test_merger = PdfWriter()
        try:
          test_merger.append(pdf_path)
          test_merger.write(io.BytesIO())
        except Exception:
          return {"status": "error", "msg": file_error(owner, "לא ניתן לעבד את הקובץ")}
        finally:
          test_merger.close()

      # If we got here, unknown error
      return {"status": "error", "msg": "שגיאה במיזוג הקבצים - " + str(ex)}

    infile = PdfReader(merged_file, strict=False)
    outfile = PdfWriter()
    total_pages = len(infile.pages)
    draft = "isDraft" in docs and docs["isDraft"]==True

    current_step += 1
    for page_num in range(total_pages):
      send_message("ממספר את העמודים במסמך - {}/{}".format(page_num+1, total_pages), "numbering", current_step)
      page = infile.pages[page_num]
      page.merge_page(page_number(page_num+1, draft))
      # Add attachment index overlay on first page of each non-ignoreTOC attachment
      page_number_1based = page_num + 1
      if page_number_1based in attachment_first_pages:
        page.merge_page(attachment_index_overlay(attachment_first_pages[page_number_1based]))
      # merge_page leaves the content uncompressed - compress it to keep the output small
      outfile.add_page(page).compress_content_streams()
    current_step += 1
    send_message("מפיק את הקובץ הסופי של המסמך המעובד", "saving", current_step)
    with open(output_path, "wb") as fp:
      outfile.write(fp)
      updated_date = datetime.datetime.now().strftime("%Y-%m-%d")
      docs["output"] = {"path": output_path, "updated": updated_date}
      result["output"] = docs["output"]
  except PermissionError:
    result = {"status": "error", "msg": "לא ניתן לייצר את הקובץ, ייתכן שכבר פתוח או שאין הרשאת כתיבה לתיקייה"}
  except Exception as ex:
    result = {"status": "error", "msg": str(ex) if str(ex) else type(ex).__name__}
  finally:
    merger.close()
    converter.close()

  #current_step += 1
  #send_message("מוחק קבצים זמניים", "saving", current_step)
  try:
    shutil.rmtree(temp_dir)
  except:
    pass  # If there's an issue deleting temp folder, don't crash the program
  return result;

if __name__ == "__main__":
  sys.stdout.reconfigure(encoding='utf-8')  # Ensure UTF-8 output
  result = {"status": "error", "msg": "תקלה בפרמטרים"}
  try:
    if getattr(sys, 'frozen', False):
      base_dir = os.path.dirname(sys.executable)
      internal_dir = os.path.join(base_dir, "_internal")
      if os.path.exists(internal_dir):
        base_dir = internal_dir
    else:
      base_dir = os.path.dirname(os.path.abspath(__file__))

    fifo = os.open(PIPE_PATH, os.O_WRONLY)
    #fifo=None
    docs = json.loads(sys.argv[1])
    #docs = json.loads(r'{"main":"C:\\din.docs\\temp.pdf","attachments":[],"output":{"path":"C:\\Users\\Moshe\\Downloads\\test.pdf"},"isDraft":true}')
    result = generate(fifo, docs)
  finally:
    if fifo: os.close(fifo)
    print(json.dumps(result))
    


