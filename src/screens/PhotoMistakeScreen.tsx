/**
 * 家长中心 · 拍照错题（V4.1）
 * 1. 家长拍下（或从相册选）孩子做错的题 → 自家 AI 服务转给阿里云百炼视觉模型识别题目、孩子的答案和知识点
 * 2. 家长核对、修改识别结果，确认知识点
 * 3. 出 5 道同类题：数学用原创出题程序（答案由程序计算）；语文、英语由 AI 出，标注“AI 生成，未经人工审核”
 * 4. 保存：只存文字（照片不保存），可以打印；数学可以让孩子在 APP 里练这个知识点
 * 必须先通过家长验证。
 */
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { aiPhotoAnalyze, aiPhotoSimilar, AiError, type PhotoSimilarItem } from '@/ai/client';
import { DisplayTextView } from '@/components/PinyinText';
import { isParentUnlocked, markParentUnlocked, ParentGate } from '@/components/ParentGate';
import { Header, LoadingView, Notice, Screen } from '@/components/Screen';
import { BigButton, Card, SectionTitle } from '@/components/ui';
import { printHtml } from '@/exam/print';
import { hasGenerator } from '@/knowledge/generators';
import { getKp, kpsFor, type KpSubject } from '@/knowledge/graph';
import { useNav } from '@/nav/Nav';
import { pickPhoto } from '@/photo/image';
import { AI_LABEL, allCandidates, candidatesFor, canMakeMath, mathItem, mathSimilarIds, newPhotoId, photoHtml, SUBJECT_NAME } from '@/photo/logic';
import type { PhotoMistake } from '@/progress/model';
import { useProgress } from '@/progress/ProgressContext';
import { formatDateTime } from '@/progress/stats';
import { colors, radius, space } from '@/theme';

const SUBJECTS: KpSubject[] = ['math', 'chinese', 'english'];
const LETTERS = 'ABCD';

export default function PhotoMistakeScreen() {
  const { status } = useProgress();
  const nav = useNav();
  const [passed, setPassed] = useState(isParentUnlocked);
  if (status === 'loading') return <LoadingView />;
  return (
    <Screen bg="#F2F1FF" testID="photo-screen">
      <Header title="拍照错题" onBack={nav.back} />
      {passed ? (
        <PhotoBody />
      ) : (
        <ParentGate
          onPass={() => {
            markParentUnlocked();
            setPassed(true);
          }}
        />
      )}
    </Screen>
  );
}

function Chip({ label, on, onPress, testID }: { label: string; on: boolean; onPress: () => void; testID: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, on && styles.chipOn]}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      testID={testID}
    >
      <Text style={[styles.chipText, on && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

interface Draft {
  subject: KpSubject;
  question: string;
  childAnswer: string;
  correctAnswer: string;
  kpId: string;
  reason: string;
}

type Step =
  | { s: 'home' }
  | { s: 'busy'; text: string }
  | { s: 'confirm'; draft: Draft }
  | { s: 'preview'; draft: Draft; exerciseIds: string[]; aiItems: PhotoSimilarItem[] }
  | { s: 'detail'; id: string };

function errText(e: unknown): string {
  if (e instanceof AiError) return e.detail ? `${e.message}（${e.detail}）` : e.message;
  return e instanceof Error ? e.message : String(e);
}

function PhotoBody() {
  const { state, dispatch } = useProgress();
  const grade = state.settings.grade ?? 1;
  const cfg = { enabled: state.settings.aiEnabled, baseUrl: state.settings.aiBaseUrl };
  const [hint, setHint] = useState<KpSubject | ''>('');
  const [step, setStep] = useState<Step>({ s: 'home' });
  const [error, setError] = useState<string | null>(null);

  const start = async (from: 'camera' | 'library') => {
    setError(null);
    const p = await pickPhoto(from, () => setStep({ s: 'busy', text: '正在识别…' }));
    if (!p.ok) {
      setStep({ s: 'home' });
      if (p.reason === 'denied') setError(from === 'camera' ? '没有相机权限，请在手机设置里允许本 APP 使用相机。' : '没有相册权限，请在手机设置里允许本 APP 读取照片。');
      else if (p.reason === 'error') setError(`没有拿到照片：${p.message ?? ''}`);
      return;
    }
    try {
      const r = await aiPhotoAnalyze(cfg, {
        image: p.dataUrl,
        grade,
        subject: hint || undefined,
        candidates: hint ? candidatesFor(hint, grade) : allCandidates(grade),
      });
      if (!r.question) {
        setError('照片里没有认出题目，请拍清楚一点再试（只拍一道错题效果最好）。');
        setStep({ s: 'home' });
        return;
      }
      const subject = hint || r.subject;
      const kpOk = r.kpId && SUBJECTS.includes(subject) && kpsFor(subject, grade).some((k) => k.id === r.kpId);
      setStep({ s: 'confirm', draft: { ...r, subject, kpId: kpOk ? r.kpId : '' } });
    } catch (e) {
      setError(`识别没有成功：${errText(e)}`);
      setStep({ s: 'home' });
    }
  };

  const generate = async (draft: Draft) => {
    setError(null);
    if (draft.subject === 'math') {
      const ids = mathSimilarIds(draft.kpId, 5);
      if (!ids.length) {
        setError('这个知识点还没有原创出题程序，数学同类题出不了。可以换一个更贴切的知识点。');
        return;
      }
      setStep({ s: 'preview', draft, exerciseIds: ids, aiItems: [] });
      return;
    }
    setStep({ s: 'busy', text: 'AI 正在出同类题…' });
    try {
      const items = await aiPhotoSimilar(cfg, {
        subject: draft.subject,
        grade,
        question: draft.question,
        knowledgePoint: getKp(draft.kpId)?.name,
        count: 5,
      });
      setStep({ s: 'preview', draft, exerciseIds: [], aiItems: items });
    } catch (e) {
      setError(`出题没有成功：${errText(e)}`);
      setStep({ s: 'confirm', draft });
    }
  };

  const save = (draft: Draft, exerciseIds: string[], aiItems: PhotoSimilarItem[]) => {
    const entry: PhotoMistake = {
      id: newPhotoId(),
      at: Date.now(),
      subject: draft.subject,
      grade,
      kpId: draft.kpId,
      kpName: getKp(draft.kpId)?.name ?? '',
      question: draft.question.trim(),
      childAnswer: draft.childAnswer.trim(),
      correctAnswer: draft.correctAnswer.trim(),
      reason: draft.reason.trim(),
      exerciseIds,
      aiItems,
    };
    dispatch({ type: 'photo/add', entry });
    setStep({ s: 'detail', id: entry.id });
  };

  return (
    <View style={{ gap: space.lg }}>
      {error ? <Notice tone="warn" text={error} /> : null}
      {step.s === 'home' ? (
        <HomeView cfgOk={cfg.enabled} hint={hint} setHint={setHint} onPick={start} onOpen={(id) => setStep({ s: 'detail', id })} />
      ) : null}
      {step.s === 'busy' ? (
        <Card>
          <View style={styles.busy} testID="photo-busy">
            <ActivityIndicator color={colors.parent} />
            <Text style={styles.label}>{step.text}</Text>
          </View>
        </Card>
      ) : null}
      {step.s === 'confirm' ? (
        <ConfirmView
          grade={grade}
          initial={step.draft}
          onCancel={() => setStep({ s: 'home' })}
          onNext={(d) => generate(d)}
        />
      ) : null}
      {step.s === 'preview' ? (
        <Card>
          <SectionTitle>同类题预览</SectionTitle>
          <SourceTag subject={step.draft.subject} />
          <ItemsView subject={step.draft.subject} exerciseIds={step.exerciseIds} aiItems={step.aiItems} showAnswers />
          <View style={styles.btnRow}>
            <BigButton label="保存" size="md" color={colors.parent} onPress={() => save(step.draft, step.exerciseIds, step.aiItems)} testID="photo-save" />
            <BigButton label="换一组" size="md" color="#999" onPress={() => generate(step.draft)} testID="photo-regen" />
            <BigButton label="返回修改" size="md" color="#999" onPress={() => setStep({ s: 'confirm', draft: step.draft })} />
          </View>
        </Card>
      ) : null}
      {step.s === 'detail' ? <DetailView id={step.id} onBack={() => setStep({ s: 'home' })} /> : null}
    </View>
  );
}

function SourceTag({ subject }: { subject: KpSubject }) {
  return subject === 'math' ? (
    <Text style={styles.small}>同类题由原创出题程序出，答案由程序计算。</Text>
  ) : (
    <Text style={styles.aiTag} testID="photo-ai-label">
      ⚠️ {AI_LABEL}
    </Text>
  );
}

function HomeView({
  cfgOk,
  hint,
  setHint,
  onPick,
  onOpen,
}: {
  cfgOk: boolean;
  hint: KpSubject | '';
  setHint: (s: KpSubject | '') => void;
  onPick: (from: 'camera' | 'library') => void;
  onOpen: (id: string) => void;
}) {
  const { state } = useProgress();
  const list = [...state.photoMistakes].reverse().filter((m) => !hint || m.subject === hint);
  return (
    <>
      <Card>
        <SectionTitle>拍一道错题</SectionTitle>
        {!cfgOk ? <Notice tone="warn" text="请先在家长中心打开 AI 老师。" /> : null}
        <View style={styles.chips}>
          <Chip label="自动" on={hint === ''} onPress={() => setHint('')} testID="photo-hint-auto" />
          {SUBJECTS.map((s) => (
            <Chip key={s} label={SUBJECT_NAME[s]} on={hint === s} onPress={() => setHint(s)} testID={`photo-hint-${s}`} />
          ))}
        </View>
        <View style={styles.btnRow}>
          {Platform.OS !== 'web' ? (
            <BigButton label="拍照" emoji="📷" size="md" color={colors.parent} disabled={!cfgOk} onPress={() => onPick('camera')} testID="photo-camera" />
          ) : null}
          <BigButton label="从相册选" emoji="🖼️" size="md" color={colors.parent} disabled={!cfgOk} onPress={() => onPick('library')} testID="photo-library" />
        </View>
      </Card>
      <Card>
        <SectionTitle>已保存（{list.length}）</SectionTitle>
        {list.map((m) => (
          <Pressable key={m.id} onPress={() => onOpen(m.id)} style={styles.row} accessibilityRole="button" testID="photo-row">
            <Text style={styles.rowTag}>{SUBJECT_NAME[m.subject]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle} numberOfLines={2}>
                {m.question}
              </Text>
              <Text style={styles.small}>
                {m.kpName || '未选知识点'} · {formatDateTime(m.at)} · 同类题 {m.subject === 'math' ? m.exerciseIds.length : m.aiItems.length} 道
              </Text>
            </View>
          </Pressable>
        ))}
      </Card>
    </>
  );
}

function Field({ label, value, onChange, multiline, testID }: { label: string; value: string; onChange: (s: string) => void; multiline?: boolean; testID: string }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} multiline={multiline} style={[styles.input, multiline && { minHeight: 72 }]} testID={testID} />
    </>
  );
}

function ConfirmView({ grade, initial, onCancel, onNext }: { grade: number; initial: Draft; onCancel: () => void; onNext: (d: Draft) => void }) {
  const [d, setD] = useState<Draft>(initial);
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  const kps = useMemo(() => kpsFor(d.subject, grade), [d.subject, grade]);
  const mathBlocked = d.subject === 'math' && !canMakeMath(d.kpId);
  return (
    <Card>
      <SectionTitle>核对识别结果</SectionTitle>
      <Text style={styles.label}>科目</Text>
      <View style={styles.chips}>
        {SUBJECTS.map((s) => (
          <Chip key={s} label={SUBJECT_NAME[s]} on={d.subject === s} onPress={() => set({ subject: s, kpId: '' })} testID={`photo-subject-${s}`} />
        ))}
      </View>
      <Field label="题目" value={d.question} onChange={(v) => set({ question: v })} multiline testID="photo-question" />
      <Field label="孩子写的答案" value={d.childAnswer} onChange={(v) => set({ childAnswer: v })} testID="photo-child" />
      <Field label="正确答案（AI 识别，请核对）" value={d.correctAnswer} onChange={(v) => set({ correctAnswer: v })} testID="photo-correct" />
      <Field label="可能错在哪里" value={d.reason} onChange={(v) => set({ reason: v })} multiline testID="photo-reason" />
      <Text style={styles.label}>知识点（{grade} 年级{SUBJECT_NAME[d.subject]}）</Text>
      <View style={styles.chips}>
        {kps.map((k) => (
          <Chip key={k.id} label={k.name} on={d.kpId === k.id} onPress={() => set({ kpId: k.id })} testID={`photo-kp-${k.id}`} />
        ))}
      </View>
      {kps.length === 0 ? <Text style={styles.small}>这个年级还没有这一科的知识点。</Text> : null}
      {mathBlocked && d.kpId ? <Notice tone="warn" text="这个知识点还没有原创出题程序，数学同类题出不了，请换一个知识点。" /> : null}
      <View style={styles.btnRow}>
        <BigButton
          label="出 5 道同类题"
          size="md"
          color={colors.parent}
          disabled={!d.question.trim() || (d.subject === 'math' && mathBlocked)}
          onPress={() => onNext(d)}
          testID="photo-generate"
        />
        <BigButton label="取消" size="md" color="#999" onPress={onCancel} />
      </View>
    </Card>
  );
}

function ItemsView({ subject, exerciseIds, aiItems, showAnswers }: { subject: KpSubject; exerciseIds: string[]; aiItems: PhotoSimilarItem[]; showAnswers: boolean }) {
  if (subject === 'math') {
    return (
      <View style={{ gap: space.xs }}>
        {exerciseIds.map((id, i) => {
          const it = mathItem(id);
          return (
            <View key={id} style={styles.item} testID="photo-item">
              <Text style={styles.no}>{i + 1}.</Text>
              <View style={{ flex: 1 }}>
                {it ? (
                  <>
                    {it.stem.map((t, j) => (
                      <DisplayTextView key={j} text={t} size={16} />
                    ))}
                    {it.options ? (
                      <Text style={styles.opts}>{it.options.map((o, j) => `${LETTERS[j]}. ${typeof o.text === 'string' ? o.text : (o.text ?? []).map((x) => x.char).join('')}`).join('    ')}</Text>
                    ) : null}
                    {showAnswers ? <Text style={styles.answer}>答案：{it.answer}</Text> : null}
                  </>
                ) : (
                  <Text style={styles.small}>互动题（拖动或点选），请在 APP 里做</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  }
  return (
    <View style={{ gap: space.xs }}>
      {aiItems.map((it, i) => (
        <View key={i} style={styles.item} testID="photo-item">
          <Text style={styles.no}>{i + 1}.</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{it.question}</Text>
            <Text style={styles.opts}>{it.options.map((o, j) => `${LETTERS[j]}. ${o}`).join('    ')}</Text>
            {showAnswers ? (
              <Text style={styles.answer}>
                答案：{it.answer}
                {it.explain ? `（${it.explain}）` : ''}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

function DetailView({ id, onBack }: { id: string; onBack: () => void }) {
  const nav = useNav();
  const { state, dispatch } = useProgress();
  const m = state.photoMistakes.find((x) => x.id === id);
  const [showAnswers, setShowAnswers] = useState(false);
  const [withAnswers, setWithAnswers] = useState(true);
  const [confirmDel, setConfirmDel] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!m) return <Notice text="这道错题已经删除。" />;
  const print = async () => {
    try {
      await printHtml(photoHtml(m, withAnswers));
    } catch (e) {
      setErr(`打印没有完成：${e instanceof Error ? e.message : String(e)}`);
    }
  };
  return (
    <Card>
      <SectionTitle>{SUBJECT_NAME[m.subject]} · {m.kpName || '未选知识点'}</SectionTitle>
      <Text style={styles.small}>{formatDateTime(m.at)}</Text>
      <Text style={styles.label}>原题</Text>
      <Text style={styles.rowTitle} testID="photo-detail-question">{m.question}</Text>
      {m.childAnswer ? <Text style={styles.small}>孩子写的：{m.childAnswer}</Text> : null}
      {m.correctAnswer ? <Text style={styles.small}>正确答案：{m.correctAnswer}</Text> : null}
      {m.reason ? <Text style={styles.small}>可能错在：{m.reason}</Text> : null}
      <Text style={styles.label}>同类题</Text>
      <SourceTag subject={m.subject} />
      <View style={styles.switchRow}>
        <Text style={styles.small}>显示答案</Text>
        <Switch value={showAnswers} onValueChange={setShowAnswers} testID="photo-show-answers" />
      </View>
      <ItemsView subject={m.subject} exerciseIds={m.exerciseIds} aiItems={m.aiItems} showAnswers={showAnswers} />
      {err ? <Notice tone="warn" text={err} /> : null}
      <View style={styles.switchRow}>
        <Text style={styles.small}>打印时附答案页</Text>
        <Switch value={withAnswers} onValueChange={setWithAnswers} />
      </View>
      <View style={styles.btnRow}>
        <BigButton label="打印" emoji="🖨️" size="md" color={colors.parent} onPress={print} testID="photo-print" />
        {m.subject === 'math' && m.kpId && hasGenerator(m.kpId) ? (
          <BigButton label="让孩子练这个知识点" size="md" color={colors.correct} onPress={() => nav.push({ name: 'practice', id: `kp:${m.kpId}` })} testID="photo-practice" />
        ) : null}
      </View>
      <View style={styles.btnRow}>
        <BigButton label="返回列表" size="md" color="#999" onPress={onBack} />
        {confirmDel ? (
          <BigButton
            label="确定删除"
            size="md"
            color={colors.wrong}
            onPress={() => {
              dispatch({ type: 'photo/remove', id: m.id });
              onBack();
            }}
            testID="photo-delete-confirm"
          />
        ) : (
          <BigButton label="删除" size="md" color="#999" onPress={() => setConfirmDel(true)} testID="photo-delete" />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: space.sm },
  small: { fontSize: 12, color: colors.textSoft, marginTop: space.xs },
  aiTag: { fontSize: 13, fontWeight: '700', color: '#B45309', backgroundColor: '#FFF4D6', borderRadius: radius.sm, padding: space.xs, marginTop: space.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.xs },
  chip: {
    paddingHorizontal: space.md,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.parent,
    backgroundColor: '#fff',
    maxWidth: '100%',
    paddingVertical: 6,
  },
  chipOn: { backgroundColor: colors.parent },
  chipText: { fontSize: 15, fontWeight: '700', color: colors.parent },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm },
  busy: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.md },
  input: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.sm,
    padding: space.sm,
    fontSize: 16,
    color: colors.text,
    backgroundColor: '#fff',
    marginTop: space.xs,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowTag: { fontSize: 12, fontWeight: '800', color: '#fff', backgroundColor: colors.parent, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  rowTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  item: { flexDirection: 'row', gap: space.xs, borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: space.xs },
  no: { fontSize: 16, fontWeight: '800', color: colors.text, minWidth: 26 },
  opts: { fontSize: 15, color: colors.text, marginTop: 2 },
  answer: { fontSize: 13, fontWeight: '800', color: colors.correct, marginTop: 2 },
});
