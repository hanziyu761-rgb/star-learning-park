"""
把 review-out/grade{1-6}-review.json 生成老师用的 Excel 审核表：review-out/{一～六}年级教师审核表.xlsx
- “说明”页：怎么审、各部分有多少条、题库自动核查结果
- 每个分类一页；每行最后两列“审核结论”（下拉：通过 / 需修改 / 删除）和“修改意见”留给老师填写
运行：python3 tools/review/make_xlsx.py
"""
import json
import os
import sys

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "review-out")

COLS = ["编号", "位置", "题型", "题目", "选项", "答案", "讲解", "多音字核对", "自动核查", "来源", "审核结论", "修改意见"]
WIDTH = {"编号": 16, "位置": 18, "题型": 8, "题目": 46, "选项": 28, "答案": 18, "讲解": 36, "多音字核对": 18,
         "自动核查": 20, "来源": 22, "审核结论": 10, "修改意见": 30}
ORDER = ["课程", "知识点小讲解", "知识点练习（程序出题）", "口算闯关", "描红写字", "每日挑战", "英语单词卡", "游戏（多音字）", "题库（AI 生成）"]
SHEET = {"课程": "课程与阅读", "知识点小讲解": "小讲解", "知识点练习（程序出题）": "知识点练习", "口算闯关": "口算",
         "描红写字": "描红写字", "每日挑战": "每日挑战", "英语单词卡": "单词卡", "游戏（多音字）": "多音字", "题库（AI 生成）": "题库"}

HEAD_FILL = PatternFill("solid", fgColor="FFE07A2E")
TEACH_FILL = PatternFill("solid", fgColor="FFFFF4CC")
WARN_FILL = PatternFill("solid", fgColor="FFFDE2E2")
thin = Side(style="thin", color="FFDDDDDD")
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)
WRAP = Alignment(wrap_text=True, vertical="top")

def build(src, dst):
    data = json.load(open(src, encoding="utf-8"))
    rows = data["rows"]
    grade_name = data.get("gradeName", "一年级")
    wb = Workbook()
    info = wb.active
    info.title = "说明"
    counts = {c: sum(1 for r in rows if r["分类"] == c) for c in ORDER}
    lines = [
        (f"林亨学习乐园 · {grade_name}内容教师审核表", True),
        (f"生成时间：{data['generatedAt'][:10]}（由程序从 APP 内容导出；内容改动后可重新导出）", False),
        ("", False),
        ("怎么审：每页最后两列由老师填写。“审核结论”选 通过 / 需修改 / 删除；需修改的在“修改意见”写明怎么改。", False),
        (f"重点看：题目说法是否符合{grade_name}孩子的理解、答案和讲解是否正确、拼音（一、二年级看“多音字核对”列）是否正确、是否超纲。", False),
        ("“自动核查”列是程序已经检查过的内容（如算式验算、拼音与词库核对），不代表内容已经过老师审核。", False),
        ("", False),
        ("各部分条数：", True),
    ]
    for c in [c for c in ORDER if counts[c]]:
        lines.append((f"  {SHEET[c]}（{c}）：{counts[c]} 条", False))
    lines += [("", False), (f"题库自动核查（{grade_name}）：", True)]
    for b in data["bankStats"]:
        lines.append((f"  {b['title']}：{b['total']} 道；结构、算式核查发现问题 {b['issues']} 道；"
                      + (f"讲解中验算了 {b['equations']} 个算式（{b['withEquations']} 道题）；" if b['equations'] else "")
                      + (f"已自动纠正多音字拼音 {b['pinyinFixedQuestions']} 道；含易错多音字 {b['polyphoneQuestions']} 道（请核对）"
                         if b['pinyinFixedQuestions'] or b['polyphoneQuestions'] else "题目不注拼音"), False))
    lines += [("", False),
              ("说明：知识点练习、每日挑战为程序出题，表中是抽样；口算闯关列出例题。题库为 ChinaStudyFree（MIT 许可）AI 生成题目（一年级已按 2024 新版教材单元编排，二～六年级仍按旧版单元）。", False),
              ("本表为“非官方”内容审核用，不包含教材原文。", False)]
    for i, (text, bold) in enumerate(lines, 1):
        cell = info.cell(row=i, column=1, value=text)
        cell.font = Font(bold=bold, size=14 if i == 1 else 11)
        cell.alignment = Alignment(wrap_text=True, vertical="top")
    info.column_dimensions["A"].width = 120

    for cat in [c for c in ORDER if counts[c]]:
        ws = wb.create_sheet(SHEET[cat])
        ws.append(COLS)
        for j, c in enumerate(COLS, 1):
            h = ws.cell(row=1, column=j)
            h.font = Font(bold=True, color="FFFFFFFF")
            h.fill = HEAD_FILL
            h.alignment = Alignment(horizontal="center", vertical="center")
            ws.column_dimensions[h.column_letter].width = WIDTH[c]
        dv = DataValidation(type="list", formula1='"通过,需修改,删除"', allow_blank=True)
        ws.add_data_validation(dv)
        n = 1
        for r in rows:
            if r["分类"] != cat:
                continue
            n += 1
            ws.append([r.get(c, "") for c in COLS[:-2]] + ["", ""])
            for j in range(1, len(COLS) + 1):
                cell = ws.cell(row=n, column=j)
                cell.alignment = WRAP
                cell.border = BORDER
            for j in (len(COLS) - 1, len(COLS)):
                ws.cell(row=n, column=j).fill = TEACH_FILL
            if "⚠" in (r.get("自动核查") or ""):
                ws.cell(row=n, column=COLS.index("自动核查") + 1).fill = WARN_FILL
            dv.add(f"{ws.cell(row=n, column=len(COLS) - 1).coordinate}")
        ws.freeze_panes = "B2"
        # 打印：横向、所有列缩到一页宽、每页重复表头
        ws.page_setup.orientation = "landscape"
        ws.page_setup.paperSize = ws.PAPERSIZE_A4
        ws.sheet_properties.pageSetUpPr.fitToPage = True
        ws.page_setup.fitToWidth = 1
        ws.page_setup.fitToHeight = 0
        ws.print_title_rows = "1:1"
        ws.auto_filter.ref = f"A1:{ws.cell(row=max(n, 1), column=len(COLS)).coordinate}"

    wb.save(dst)
    print(dst, len(rows), "条", file=sys.stderr)


for g, name in enumerate(["一", "二", "三", "四", "五", "六"], 1):
    src = os.path.join(OUT, f"grade{g}-review.json")
    if os.path.exists(src):
        build(src, os.path.join(OUT, f"{name}年级教师审核表.xlsx"))
