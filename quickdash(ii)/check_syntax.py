import sys

def check_js(filepath):
    content = open(filepath, encoding='utf-8').read()
    stack = []
    pairs = {')': '(', ']': '[', '}': '{'}
    in_str = None
    in_block = False
    escape = False
    lines = content.split('\n')
    for line_no, line in enumerate(lines, 1):
        i = 0
        while i < len(line):
            ch = line[i]
            if in_block:
                if ch == '*' and i + 1 < len(line) and line[i+1] == '/':
                    in_block = False
                    i += 2
                    continue
                i += 1
                continue
            if in_str:
                if escape:
                    escape = False
                elif ch == '\\':
                    escape = True
                elif ch == in_str:
                    in_str = None
                i += 1
                continue
            if ch == '/' and i + 1 < len(line):
                if line[i+1] == '/':
                    break
                elif line[i+1] == '*':
                    in_block = True
                    i += 2
                    continue
            if ch in ('"', "'", '`'):
                in_str = ch
                i += 1
                continue
            if ch in ('(', '[', '{'):
                stack.append((ch, line_no, i))
            elif ch in (')', ']', '}'):
                if not stack:
                    return f'Extra {ch} at line {line_no}:{i}'
                top, l, c = stack.pop()
                if pairs[ch] != top:
                    return f'Mismatched {ch} at line {line_no}:{i}, expected {top} from line {l}:{c}'
            i += 1
    if stack:
        top, l, c = stack[-1]
        return f'Unclosed {top} from line {l}:{c}'
    return 'OK'

if __name__ == '__main__':
    for f in sys.argv[1:]:
        print(f, check_js(f))
