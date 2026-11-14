"""
导入“龙呼呼”童声录音（V2.21）：家长用 record.ps1 调用自家 AI 服务批量录好、打包成 tongsheng.zip 发回。
用法：python3 tools/voice/cloud/import.py <tongsheng.zip> [更多分包.zip …]
1. 解压到临时目录，按 list.json 核对每一句都有录音（压缩包里没有的，用已经导入过的录音；V5.2 起可以只发新增的句子）
2. 转成单声道 24kHz 32kbps（和原来的预录一样省空间）放到 assets/voice/c/
3. 去掉旧的 Kokoro 女声 / 男声录音（assets/voice/f、m），重写 src/speech/voiceClips.native.ts
声音：阿里云百炼 CosyVoice（cosyvoice-v3-flash，音色 longhuhu_v3），由 APP 所有者用自己的百炼账号生成。
"""
import json, os, subprocess, sys, tempfile, zipfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
LIST = json.load(open(os.path.join(os.path.dirname(__file__), "list.json"), encoding="utf-8"))


def main(zpaths: list[str]):
    tmp = tempfile.mkdtemp(prefix="tongsheng-")
    # 可以分成几个小包发回（聊天里单个文件有大小限制），一起导入
    for zpath in zpaths:
        with zipfile.ZipFile(zpath) as z:
            for n in z.namelist():
                base = os.path.basename(n)
                if base.endswith(".mp3") and len(base) == 12:
                    with open(os.path.join(tmp, base), "wb") as f:
                        f.write(z.read(n))
    have = {f[:-4] for f in os.listdir(tmp) if os.path.getsize(os.path.join(tmp, f)) > 1000}
    out_dir = os.path.join(ROOT, "assets/voice/c")
    existing = {f[:-4] for f in os.listdir(out_dir)} if os.path.isdir(out_dir) else set()
    # V5.2：可以只补录新增的句子（压缩包里只有新句子），已经导入过的录音保留不动
    missing = [x for x in LIST if x["id"] not in have and x["id"] not in existing]
    if missing:
        print(f"缺 {len(missing)} 句，例如：", [m["text"] for m in missing[:5]])
        sys.exit(1)
    # 旧的女声、男声（Kokoro）不再使用
    for g in ("f", "m"):
        d = os.path.join(ROOT, "assets/voice", g)
        if os.path.isdir(d):
            subprocess.run(["git", "rm", "-rq", "--cached", "--ignore-unmatch", f"assets/voice/{g}"], cwd=ROOT, check=True)
            for f in os.listdir(d):
                os.remove(os.path.join(d, f))
            os.rmdir(d)
    os.makedirs(out_dir, exist_ok=True)
    todo = [x for x in LIST if x["id"] in have]
    for i, x in enumerate(todo):
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", os.path.join(tmp, x["id"] + ".mp3"), "-ac", "1", "-ar", "24000", "-b:a", "32k", os.path.join(out_dir, x["id"] + ".mp3")],
            check=True,
        )
        if i % 300 == 0:
            print(f"{i}/{len(todo)}", flush=True)
    print(f"导入新录音 {len(todo)} 句，保留原有 {len(LIST) - len(todo)} 句", flush=True)
    lines = [
        "// 自动生成：tools/voice/cloud/import.py，请勿手改。预先录好的朗读（V2.21 全 APP 统一童声）。",
        "// 声音：阿里云百炼 CosyVoice（cosyvoice-v3-flash，音色 longhuhu_v3“龙呼呼”），中文、英语同一个声音；由 APP 所有者用自己的百炼账号生成。",
        "export const CLIP_VOICES = " + json.dumps({"model": "cosyvoice-v3-flash", "voice": "longhuhu_v3"}) + ";",
        "export const CLIPS: Record<'c', Record<string, number>> = {",
        "  c: {",
    ]
    for cid in sorted(x["id"] for x in LIST):
        lines.append(f"    '{cid}': require('../../assets/voice/c/{cid}.mp3'),")
    lines += ["  },", "};"]
    open(os.path.join(ROOT, "src/speech/voiceClips.native.ts"), "w", encoding="utf-8").write("\n".join(lines) + "\n")
    size = sum(os.path.getsize(os.path.join(out_dir, f)) for f in os.listdir(out_dir))
    print(f"完成：{len(LIST)} 句，共 {size / 1e6:.1f} MB")


if __name__ == "__main__":
    main(sys.argv[1:])
