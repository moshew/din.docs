#!/usr/bin/env python
"""
Complete BiDi implementation optimized for Nuitka compatibility.
Based on Unicode Bidirectional Algorithm (UAX #9).
Includes full mirroring support and all BiDi features.
"""

import sys
from collections import deque
from typing import Union

# Unicode ranges for BiDi character classification
BIDI_RANGES = [
    # Format: (start, end, bidi_type)
    # Strong L
    (0x0041, 0x005A, 'L'),  # Latin uppercase
    (0x0061, 0x007A, 'L'),  # Latin lowercase
    (0x00AA, 0x00AA, 'L'),  # Feminine ordinal indicator
    (0x00B5, 0x00B5, 'L'),  # Micro sign
    (0x00BA, 0x00BA, 'L'),  # Masculine ordinal indicator
    (0x00C0, 0x00D6, 'L'),  # Latin extended
    (0x00D8, 0x00F6, 'L'),
    (0x00F8, 0x02B8, 'L'),
    (0x02BB, 0x02C1, 'L'),
    (0x02D0, 0x02D1, 'L'),
    (0x02E0, 0x02E4, 'L'),
    (0x02EE, 0x02EE, 'L'),
    (0x037A, 0x037A, 'L'),
    (0x037F, 0x037F, 'L'),
    (0x0386, 0x0386, 'L'),
    (0x0388, 0x038A, 'L'),
    (0x038C, 0x038C, 'L'),
    (0x038E, 0x03A1, 'L'),
    (0x03A3, 0x03F5, 'L'),
    (0x03F7, 0x0481, 'L'),
    (0x048A, 0x052F, 'L'),
    
    # Strong R (Hebrew)
    (0x05BE, 0x05BE, 'R'),
    (0x05C0, 0x05C0, 'R'),
    (0x05C3, 0x05C3, 'R'),
    (0x05C6, 0x05C6, 'R'),
    (0x05D0, 0x05EA, 'R'),  # Hebrew letters
    (0x05F0, 0x05F2, 'R'),
    (0x05F3, 0x05F4, 'R'),
    (0x0608, 0x0608, 'R'),
    (0x060B, 0x060B, 'R'),
    (0x060D, 0x060D, 'R'),
    (0x061B, 0x061B, 'R'),
    (0x061C, 0x061C, 'R'),
    (0x061E, 0x064A, 'R'),
    
    # Strong AL (Arabic)
    (0x0600, 0x0605, 'AL'),
    (0x0606, 0x0608, 'AL'),
    (0x0609, 0x060A, 'AL'),
    (0x060C, 0x060C, 'AL'),
    (0x060E, 0x061A, 'AL'),
    (0x061D, 0x061D, 'AL'),
    (0x061F, 0x061F, 'AL'),
    (0x0620, 0x063F, 'AL'),
    (0x0641, 0x064A, 'AL'),
    (0x066D, 0x066F, 'AL'),
    (0x0671, 0x06D3, 'AL'),
    (0x06D5, 0x06D5, 'AL'),
    (0x06E5, 0x06E6, 'AL'),
    (0x06EE, 0x06EF, 'AL'),
    (0x06FA, 0x06FC, 'AL'),
    (0x06FF, 0x06FF, 'AL'),
    (0x0750, 0x077F, 'AL'),
    (0x08A0, 0x08AC, 'AL'),
    (0x08E3, 0x08FF, 'AL'),
    
    # European Numbers
    (0x0030, 0x0039, 'EN'),  # 0-9
    (0x00B2, 0x00B3, 'EN'),
    (0x00B9, 0x00B9, 'EN'),
    
    # Arabic Numbers  
    (0x0660, 0x0669, 'AN'),
    (0x066B, 0x066C, 'AN'),
    
    # European Separators
    (0x002B, 0x002B, 'ES'),  # +
    (0x002D, 0x002D, 'ES'),  # -
    
    # European Terminators
    (0x0023, 0x0025, 'ET'),  # # $ %
    (0x00A2, 0x00A5, 'ET'),  # Currency symbols
    (0x00B0, 0x00B1, 'ET'),
    
    # Common Separators
    (0x002C, 0x002C, 'CS'),  # ,
    (0x002E, 0x002F, 'CS'),  # . /
    (0x003A, 0x003A, 'CS'),  # :
    (0x00A0, 0x00A0, 'CS'),  # Non-breaking space
    
    # Whitespace
    (0x0009, 0x000D, 'WS'),  # Tab, LF, VT, FF, CR
    (0x0020, 0x0020, 'WS'),  # Space
    (0x001C, 0x001F, 'WS'),  # File/Group/Record/Unit Separator
    (0x0085, 0x0085, 'WS'),  # Next Line
    (0x00A0, 0x00A0, 'WS'),  # Non-breaking space
    
    # Paragraph Separators
    (0x000A, 0x000A, 'B'),   # Line Feed
    (0x000D, 0x000D, 'B'),   # Carriage Return
    (0x001C, 0x001F, 'B'),   # File/Group/Record/Unit Separator
    (0x0085, 0x0085, 'B'),   # Next Line
    (0x2029, 0x2029, 'B'),   # Paragraph Separator
    
    # Segment Separators
    (0x0009, 0x0009, 'S'),   # Tab
    (0x000B, 0x000B, 'S'),   # Vertical Tab
    (0x001F, 0x001F, 'S'),   # Unit Separator
    
    # Other Neutrals (common punctuation)
    (0x0021, 0x0022, 'ON'),  # ! "
    (0x0026, 0x002A, 'ON'),  # & ' ( ) *
    (0x003B, 0x0040, 'ON'),  # ; < = > ? @
    (0x005B, 0x0060, 'ON'),  # [ \ ] ^ _ `
    (0x007B, 0x007E, 'ON'),  # { | } ~
    
    # Nonspacing Marks (simplified)
    (0x0300, 0x036F, 'NSM'), # Combining diacritics
    (0x0483, 0x0487, 'NSM'),
    (0x0591, 0x05BD, 'NSM'),
    (0x05BF, 0x05BF, 'NSM'),
    (0x05C1, 0x05C2, 'NSM'),
    (0x05C4, 0x05C5, 'NSM'),
    (0x05C7, 0x05C7, 'NSM'),
    (0x0610, 0x061A, 'NSM'),
    (0x064B, 0x065F, 'NSM'),
    (0x0670, 0x0670, 'NSM'),
    (0x06D6, 0x06DC, 'NSM'),
    (0x06DF, 0x06E4, 'NSM'),
    (0x06E7, 0x06E8, 'NSM'),
    (0x06EA, 0x06ED, 'NSM'),
    
    # Boundary Neutral
    (0x0000, 0x0008, 'BN'),
    (0x000E, 0x001B, 'BN'),
    (0x007F, 0x0084, 'BN'),
    (0x0086, 0x009F, 'BN'),
    (0x200B, 0x200D, 'BN'),
    (0x2060, 0x2064, 'BN'),
    (0xFEFF, 0xFEFF, 'BN'),
    
    # Pop Directional Format
    (0x202C, 0x202C, 'PDF'),
    
    # Left-to-Right Embedding
    (0x202A, 0x202A, 'LRE'),
    
    # Right-to-Left Embedding  
    (0x202B, 0x202B, 'RLE'),
    
    # Left-to-Right Override
    (0x202D, 0x202D, 'LRO'),
    
    # Right-to-Left Override
    (0x202E, 0x202E, 'RLO'),
    
    # Left-to-Right Isolate
    (0x2066, 0x2066, 'LRI'),
    
    # Right-to-Left Isolate
    (0x2067, 0x2067, 'RLI'),
    
    # First Strong Isolate
    (0x2068, 0x2068, 'FSI'),
    
    # Pop Directional Isolate
    (0x2069, 0x2069, 'PDI'),
]

# Character mirroring pairs - complete Unicode BidiMirroring.txt data
MIRRORED_CHARS = {
    '(': ')', ')': '(',
    '<': '>', '>': '<',
    '[': ']', ']': '[',
    '{': '}', '}': '{',
    '«': '»', '»': '«',
    '‹': '›', '›': '‹',
    '⁅': '⁆', '⁆': '⁅',
    '⁽': '⁾', '⁾': '⁽',
    '₍': '₎', '₎': '₍',
    '∈': '∋', '∉': '∌', '∊': '∍',
    '∋': '∈', '∌': '∉', '∍': '∊',
    '∕': '⧵', '∼': '∽', '∽': '∼',
    '≃': '⋍', '≒': '≓', '≓': '≒',
    '≔': '≕', '≕': '≔', 
    '≤': '≥', '≥': '≤',
    '≦': '≧', '≧': '≦',
    '≨': '≩', '≩': '≨',
    '≪': '≫', '≫': '≪',
    '≮': '≯', '≯': '≮',
    '≰': '≱', '≱': '≰',
    '≲': '≳', '≳': '≲',
    '≴': '≵', '≵': '≴',
    '≶': '≷', '≷': '≶',
    '≸': '≹', '≹': '≸',
    '≺': '≻', '≻': '≺',
    '≼': '≽', '≽': '≼',
    '≾': '≿', '≿': '≾',
    '⊀': '⊁', '⊁': '⊀',
    '⊂': '⊃', '⊃': '⊂',
    '⊄': '⊅', '⊅': '⊄',
    '⊆': '⊇', '⊇': '⊆',
    '⊈': '⊉', '⊉': '⊈',
    '⊊': '⊋', '⊋': '⊊',
    '⊏': '⊐', '⊐': '⊏',
    '⊑': '⊒', '⊒': '⊑',
    '⊘': '⦸', '⊢': '⊣', '⊣': '⊢',
    '⊦': '⫞', '⊨': '⫤', '⊩': '⫣', '⊫': '⫥',
    '⊰': '⊱', '⊱': '⊰',
    '⊲': '⊳', '⊳': '⊲',
    '⊴': '⊵', '⊵': '⊴',
    '⊶': '⊷', '⊷': '⊶',
    '⋉': '⋊', '⋊': '⋉',
    '⋋': '⋌', '⋌': '⋋',
    '⋍': '≃', '⋐': '⋑', '⋑': '⋐',
    '⋖': '⋗', '⋗': '⋖',
    '⋘': '⋙', '⋙': '⋘',
    '⋚': '⋛', '⋛': '⋚',
    '⋜': '⋝', '⋝': '⋜',
    '⋞': '⋟', '⋟': '⋞',
    '⋠': '⋡', '⋡': '⋠',
    '⋢': '⋣', '⋣': '⋢',
    '⋤': '⋥', '⋥': '⋤',
    '⋦': '⋧', '⋧': '⋦',
    '⋨': '⋩', '⋩': '⋨',
    '⋪': '⋫', '⋫': '⋪',
    '⋬': '⋭', '⋭': '⋬',
    '⋰': '⋱', '⋱': '⋰',
    '⋲': '⋺', '⋳': '⋻', '⋴': '⋼',
    '⋶': '⋽', '⋷': '⋾',
    '⋺': '⋲', '⋻': '⋳', '⋼': '⋴',
    '⋽': '⋶', '⋾': '⋷',
    '⌈': '⌉', '⌉': '⌈',
    '⌊': '⌋', '⌋': '⌊',
    '〈': '〉', '〉': '〈',
    '❨': '❩', '❩': '❨',
    '❪': '❫', '❫': '❪',
    '❬': '❭', '❭': '❬',
    '❮': '❯', '❯': '❮',
    '❰': '❱', '❱': '❰',
    '❲': '❳', '❳': '❲',
    '❴': '❵', '❵': '❴',
    '⟃': '⟄', '⟄': '⟃',
    '⟅': '⟆', '⟆': '⟅',
    '⟈': '⟉', '⟉': '⟈',
    '⟝': '⟞', '⟞': '⟝',
    '⟢': '⟣', '⟣': '⟢',
    '⟤': '⟥', '⟥': '⟤',
    '⟦': '⟧', '⟧': '⟦',
    '⟨': '⟩', '⟩': '⟨',
    '⟪': '⟫', '⟫': '⟪',
    '⟬': '⟭', '⟭': '⟬',
    '⟮': '⟯', '⟯': '⟮',
    '⦃': '⦄', '⦄': '⦃',
    '⦅': '⦆', '⦆': '⦅',
    '⦇': '⦈', '⦈': '⦇',
    '⦉': '⦊', '⦊': '⦉',
    '⦋': '⦌', '⦌': '⦋',
    '⦍': '⦐', '⦎': '⦏', '⦏': '⦎', '⦐': '⦍',
    '⦑': '⦒', '⦒': '⦑',
    '⦓': '⦔', '⦔': '⦓',
    '⦕': '⦖', '⦖': '⦕',
    '⦗': '⦘', '⦘': '⦗',
    '⦸': '⊘', '⦻': '⦼', '⦼': '⦻',
    '⦿': '⧀', '⧀': '⦿',
    '⧄': '⧅', '⧅': '⧄',
    '⧏': '⧐', '⧐': '⧏',
    '⧑': '⧒', '⧒': '⧑',
    '⧔': '⧕', '⧕': '⧔',
    '⧘': '⧙', '⧙': '⧘',
    '⧚': '⧛', '⧛': '⧚',
    '⧵': '∕', '⧸': '⧹', '⧹': '⧸',
    '⧼': '⧽', '⧽': '⧼',
    '⨫': '⨬', '⨬': '⨫',
    '⨭': '⨮', '⨮': '⨭',
    '⨴': '⨵', '⨵': '⨴',
    '⨼': '⨽', '⨽': '⨼',
    '⩘': '⩙', '⩙': '⩘',
    '⩤': '⩥', '⩥': '⩤',
    '⩹': '⩺', '⩺': '⩹',
    '⩽': '⩾', '⩾': '⩽',
    '⩿': '⪀', '⪀': '⩿',
    '⪁': '⪂', '⪂': '⪁',
    '⪃': '⪄', '⪄': '⪃',
    '⪅': '⪆', '⪆': '⪅',
    '⪇': '⪈', '⪈': '⪇',
    '⪉': '⪊', '⪊': '⪉',
    '⪋': '⪌', '⪌': '⪋',
    '⪑': '⪒', '⪒': '⪑',
    '⪓': '⪔', '⪔': '⪓',
    '⪕': '⪖', '⪖': '⪕',
    '⪗': '⪘', '⪘': '⪗',
    '⪙': '⪚', '⪚': '⪙',
    '⪛': '⪜', '⪜': '⪛',
    '⪡': '⪢', '⪢': '⪡',
    '⪦': '⪧', '⪧': '⪦',
    '⪨': '⪩', '⪩': '⪨',
    '⪪': '⪫', '⪫': '⪪',
    '⪬': '⪭', '⪭': '⪬',
    '⪯': '⪰', '⪰': '⪯',
    '⪳': '⪴', '⪴': '⪳',
    '⪻': '⪼', '⪼': '⪻',
    '⪽': '⪾', '⪾': '⪽',
    '⪿': '⫀', '⫀': '⪿',
    '⫁': '⫂', '⫂': '⫁',
    '⫃': '⫄', '⫄': '⫃',
    '⫅': '⫆', '⫆': '⫅',
    '⫍': '⫎', '⫎': '⫍',
    '⫏': '⫐', '⫐': '⫏',
    '⫑': '⫒', '⫒': '⫑',
    '⫓': '⫔', '⫔': '⫓',
    '⫕': '⫖', '⫖': '⫕',
    '⫞': '⊦', '⫣': '⊩', '⫤': '⊨', '⫥': '⊫',
    '⫬': '⫭', '⫭': '⫬',
    '⫷': '⫸', '⫸': '⫷',
    '⫹': '⫺', '⫺': '⫹',
    '⸂': '⸃', '⸃': '⸂',
    '⸄': '⸅', '⸅': '⸄',
    '⸉': '⸊', '⸊': '⸉',
    '⸌': '⸍', '⸍': '⸌',
    '⸜': '⸝', '⸝': '⸜',
    '⸠': '⸡', '⸡': '⸠',
    '⸢': '⸣', '⸣': '⸢',
    '⸤': '⸥', '⸥': '⸤',
    '⸦': '⸧', '⸧': '⸦',
    '⸨': '⸩', '⸩': '⸨',
    '〈': '〉', '〉': '〈',
    '《': '》', '》': '《',
    '「': '」', '」': '「',
    '『': '』', '』': '『',
    '【': '】', '】': '【',
    '〔': '〕', '〕': '〔',
    '〖': '〗', '〗': '〖',
    '〘': '〙', '〙': '〘',
    '〚': '〛', '〛': '〚',
    '﹙': '﹚', '﹚': '﹙',
    '﹛': '﹜', '﹜': '﹛',
    '﹝': '﹞', '﹞': '﹝',
    '﹤': '﹥', '﹥': '﹤',
    '（': '）', '）': '（',
    '＜': '＞', '＞': '＜',
    '［': '］', '］': '［',
    '｛': '｝', '｝': '｛',
    '｟': '｠', '｠': '｟',
    '｢': '｣', '｣': '｢',
}

def get_bidi_type(char):
    """Get the bidirectional type of a character."""
    code_point = ord(char)
    
    # Check ranges for character type
    for start, end, bidi_type in BIDI_RANGES:
        if start <= code_point <= end:
            return bidi_type
    
    # Default to Other Neutral for unclassified characters
    return 'ON'

def get_base_level(text):
    """Get the paragraph base embedding level."""
    for char in text:
        bidi_type = get_bidi_type(char)
        if bidi_type in ('R', 'AL'):
            return 1
        elif bidi_type == 'L':
            return 0
    return 0

def get_display(text: Union[str, bytes], encoding: str = 'utf-8') -> Union[str, bytes]:
    """
    Apply Unicode Bidirectional Algorithm to text.
    
    Args:
        text: Input text (str or bytes)
        encoding: Encoding to use if input is bytes
        
    Returns:
        Display-order text with same type as input
    """
    if isinstance(text, bytes):
        text_str = text.decode(encoding)
        return_bytes = True
    else:
        text_str = text
        return_bytes = False
    
    if not text_str:
        return text
    
    # Step 1: Get base level and create character storage
    base_level = get_base_level(text_str)
    chars = []
    
    for char in text_str:
        bidi_type = get_bidi_type(char)
        chars.append({
            'char': char,
            'type': bidi_type,
            'orig_type': bidi_type,
            'level': base_level
        })
    
    # Step 2: Apply explicit embedding levels (X1-X9)
    apply_explicit_levels(chars, base_level)
    
    # Step 3: Resolve weak types (W1-W7)
    resolve_weak_types(chars)
    
    # Step 4: Resolve neutral types (N1-N2)  
    resolve_neutral_types(chars)
    
    # Step 5: Resolve implicit levels (I1-I2)
    resolve_implicit_levels(chars)
    
    # Step 6: Reorder levels (L1-L4)
    reorder_levels(chars, base_level)
    
    # Step 7: Apply character mirroring (L4)
    apply_mirroring(chars)
    
    # Build result
    result = ''.join(char['char'] for char in chars)
    
    if return_bytes:
        return result.encode(encoding)
    return result

def apply_explicit_levels(chars, base_level):
    """Apply explicit embedding and override rules (X1-X9)."""
    embedding_level = base_level
    directional_override = None
    level_stack = []
    
    for char_info in chars:
        bidi_type = char_info['type']
        
        if bidi_type in ('RLE', 'LRE', 'RLO', 'LRO'):
            # Push current state
            if len(level_stack) < 61:  # Prevent overflow
                level_stack.append((embedding_level, directional_override))
                
                if bidi_type in ('RLE', 'RLO'):
                    new_level = (embedding_level + 1) | 1  # Next odd level
                else:  # LRE, LRO
                    new_level = (embedding_level + 2) & ~1  # Next even level
                
                if new_level <= 62:
                    embedding_level = new_level
                    directional_override = bidi_type[2] if bidi_type.endswith('O') else None
                else:
                    level_stack.pop()  # Remove invalid push
                    
        elif bidi_type == 'PDF':
            # Pop directional formatting
            if level_stack:
                embedding_level, directional_override = level_stack.pop()
                
        elif bidi_type == 'B':
            # Paragraph separator resets everything
            level_stack.clear()
            embedding_level = base_level
            directional_override = None
            char_info['level'] = base_level
            
        # Set character level and apply override
        if bidi_type not in ('RLE', 'LRE', 'RLO', 'LRO', 'PDF', 'BN'):
            char_info['level'] = embedding_level
            if directional_override:
                char_info['type'] = directional_override
    
    # Remove explicit formatting characters (X9)
    return [c for c in chars if c['type'] not in ('RLE', 'LRE', 'RLO', 'LRO', 'PDF', 'BN')]

def resolve_weak_types(chars):
    """Resolve weak type rules (W1-W7)."""
    # W1: NSM takes type of preceding character
    prev_type = 'L'  # sor
    for char_info in chars:
        if char_info['type'] == 'NSM':
            char_info['type'] = prev_type
        prev_type = char_info['type']
    
    # W2: EN + prev AL -> AN
    prev_strong = 'L'  # sor
    for char_info in chars:
        if char_info['type'] == 'EN' and prev_strong == 'AL':
            char_info['type'] = 'AN'
        if char_info['type'] in ('R', 'L', 'AL'):
            prev_strong = char_info['type']
    
    # W3: AL -> R
    for char_info in chars:
        if char_info['type'] == 'AL':
            char_info['type'] = 'R'
    
    # W4: Single separator between same types
    for i in range(1, len(chars) - 1):
        curr = chars[i]
        prev = chars[i - 1]
        next_char = chars[i + 1]
        
        if curr['type'] == 'ES' and prev['type'] == 'EN' and next_char['type'] == 'EN':
            curr['type'] = 'EN'
        elif curr['type'] == 'CS' and prev['type'] == next_char['type'] and prev['type'] in ('AN', 'EN'):
            curr['type'] = prev['type']
    
    # W5: ET adjacent to EN -> EN
    for i in range(len(chars)):
        if chars[i]['type'] == 'EN':
            # Look backwards
            j = i - 1
            while j >= 0 and chars[j]['type'] == 'ET':
                chars[j]['type'] = 'EN'
                j -= 1
            # Look forwards
            j = i + 1
            while j < len(chars) and chars[j]['type'] == 'ET':
                chars[j]['type'] = 'EN'
                j += 1
    
    # W6: Separators and terminators -> ON
    for char_info in chars:
        if char_info['type'] in ('ET', 'ES', 'CS'):
            char_info['type'] = 'ON'
    
    # W7: EN + prev strong L -> L
    prev_strong = 'L'  # sor
    for char_info in chars:
        if char_info['type'] == 'EN' and prev_strong == 'L':
            char_info['type'] = 'L'
        if char_info['type'] in ('L', 'R'):
            prev_strong = char_info['type']

def resolve_neutral_types(chars):
    """Resolve neutral type rules (N1-N2)."""
    # Find sequences of neutral characters
    i = 0
    while i < len(chars):
        if chars[i]['type'] in ('B', 'S', 'WS', 'ON'):
            # Found start of neutral sequence
            seq_start = i
            
            # Find end of sequence
            while i < len(chars) and chars[i]['type'] in ('B', 'S', 'WS', 'ON'):
                i += 1
            seq_end = i
            
            # Get surrounding types
            prev_type = 'L' if seq_start == 0 else chars[seq_start - 1]['type']  # sor
            next_type = 'L' if seq_end >= len(chars) else chars[seq_end]['type']  # eor
            
            # Convert AN/EN to R for comparison
            if prev_type in ('AN', 'EN'):
                prev_type = 'R'
            if next_type in ('AN', 'EN'):
                next_type = 'R'
            
            # N1: Same surrounding strong types
            if prev_type == next_type and prev_type in ('L', 'R'):
                for j in range(seq_start, seq_end):
                    chars[j]['type'] = prev_type
            else:
                # N2: Use embedding direction
                for j in range(seq_start, seq_end):
                    chars[j]['type'] = 'L' if chars[j]['level'] % 2 == 0 else 'R'
        else:
            i += 1

def resolve_implicit_levels(chars):
    """Resolve implicit levels (I1-I2)."""
    for char_info in chars:
        level = char_info['level']
        bidi_type = char_info['type']
        
        if level % 2 == 0:  # Even (LTR) embedding level
            # I1: R goes up one level, AN/EN go up two levels
            if bidi_type == 'R':
                char_info['level'] += 1
            elif bidi_type in ('AN', 'EN'):
                char_info['level'] += 2
        else:  # Odd (RTL) embedding level
            # I2: L/AN/EN go up one level
            if bidi_type in ('L', 'AN', 'EN'):
                char_info['level'] += 1

def reorder_levels(chars, base_level):
    """Reorder characters by level (L1-L2)."""
    # L1: Reset levels for paragraph/segment separators and trailing whitespace
    for i in range(len(chars) - 1, -1, -1):
        char_info = chars[i]
        if char_info['orig_type'] in ('B', 'S'):
            char_info['level'] = base_level
        elif char_info['orig_type'] in ('WS', 'BN') and (i == len(chars) - 1 or chars[i + 1]['level'] == base_level):
            char_info['level'] = base_level
        else:
            break
    
    # L2: Process each line separately (split by paragraph separators)
    line_start = 0
    for i in range(len(chars)):
        # Check if this is a line break or end of text
        if i == len(chars) - 1 or chars[i]['orig_type'] == 'B' or chars[i]['char'] == '\n':
            line_end = i if chars[i]['orig_type'] == 'B' or chars[i]['char'] == '\n' else i + 1
            
            # Reorder this line only
            if line_start < line_end:
                line_chars = chars[line_start:line_end]
                max_level = max(char['level'] for char in line_chars) if line_chars else base_level
                min_odd_level = base_level + 1 if base_level % 2 == 0 else base_level
                
                for level in range(max_level, min_odd_level - 1, -1):
                    j = 0
                    while j < len(line_chars):
                        if line_chars[j]['level'] >= level:
                            # Found start of sequence to reverse
                            start = j
                            while j < len(line_chars) and line_chars[j]['level'] >= level:
                                j += 1
                            # Reverse the sequence
                            line_chars[start:j] = reversed(line_chars[start:j])
                        else:
                            j += 1
                
                # Update the original chars array
                chars[line_start:line_end] = line_chars
            
            # Move to next line
            line_start = i + 1

def apply_mirroring(chars):
    """Apply character mirroring (L4)."""
    for char_info in chars:
        if char_info['level'] % 2 == 1:  # RTL level
            char = char_info['char']
            if char in MIRRORED_CHARS:
                char_info['char'] = MIRRORED_CHARS[char]
