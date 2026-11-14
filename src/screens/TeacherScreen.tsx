/**
 * 问问星星宝：AI 老师对话。
 * 孩子可以点“快捷问题”、点话筒说话提问（V2.17，安卓 APP，家长开启后才有；离线识别，声音不离开手机），也可以由家长帮忙输入；回复会自动朗读。
 */
import React, { useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AiError, aiChat, AI_ERROR_TEXT, type ChatMessage } from '@/ai/client';
import { zh } from '@/content/zh';
import { Mascot } from '@/components/Mascot';
import { DisplayTextView } from '@/components/PinyinText';
import { Header, LoadingView, Notice } from '@/components/Screen';
import { SpeakerButton, tapFeedback } from '@/components/ui';
import type { Subject } from '@/lesson/types';
import { useNav } from '@/nav/Nav';
import { useProgress } from '@/progress/ProgressContext';
import { SUBJECTS } from '@/progress/stats';
import { useVoiceInput, VOICE_PROBLEM_TEXT } from '@/speech/asr';
import { speak, stopSpeaking } from '@/speech/speech';
import { colors, MIN_TOUCH, radius, space, subjectTheme, themed } from '@/theme';
import { contentGrade } from '@/progress/grade';

const QUICK: Record<Subject, string[]> = {
  math: ['加法是什么意思？', '怎样比大小？', '给我出一道口算题', '讲一个数学小故事'],
  chinese: ['“日”字怎么记？', '教我一个新词语', '讲一个小故事', '“山”字可以组什么词？'],
  english: ["Let's talk in English!", '苹果用英语怎么说？', '教我说你好', 'What color is the sky?'],
};

export default function TeacherScreen() {
  const { status } = useProgress();
  if (status === 'loading') return <LoadingView />;
  return <TeacherChat />;
}

function TeacherChat() {
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const { state } = useProgress();
  const { aiEnabled, aiBaseUrl, grade, voiceInput } = state.settings;
  const [subject, setSubject] = useState<Subject>('math');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const send = async (text: string) => {
    const content = text.trim().slice(0, 100);
    if (!content || loading) return;
    tapFeedback();
    stopSpeaking();
    const next: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setError(null);
    setLoading(true);
    try {
      const reply = await aiChat({ enabled: aiEnabled, baseUrl: aiBaseUrl }, { subject, grade: contentGrade(grade), messages: next });
      setMessages([...next, { role: 'assistant', content: reply }]);
      speak({ text: reply, lang: subject === 'english' && /^[\x00-\x7F\s]+$/.test(reply) ? 'en-US' : 'zh-CN', cloud: true });
    } catch (e) {
      const msg = e instanceof AiError ? e.message : AI_ERROR_TEXT.SERVER;
      setError(msg);
      speak({ text: msg, lang: 'zh-CN' });
    } finally {
      setLoading(false);
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const voice = useVoiceInput((text) => send(text));
  const showMic = voice.available && voiceInput;
  const listening = voice.state === 'listening' || voice.state === 'starting' || voice.state === 'thinking';

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.sm }]} testID="teacher-screen">
      <View style={styles.pad}>
        <Header title={zh('问问星星宝', 'wèn wen xīng xing bǎo')} onBack={nav.back} />
      </View>
      {!aiEnabled ? (
        <View style={styles.pad}>
          <Notice text={AI_ERROR_TEXT.DISABLED} />
        </View>
      ) : (
        <>
          <View style={styles.tabs}>
            {SUBJECTS.map((s) => (
              <Pressable
                key={s}
                onPress={() => setSubject(s)}
                style={[styles.tab, subject === s && { backgroundColor: subjectTheme[s].color }]}
                accessibilityRole="button"
                testID={`teacher-subject-${s}`}
              >
                <Text style={[styles.tabText, subject === s && { color: colors.onAccent }]}>
                  {subjectTheme[s].emoji} {subjectTheme[s].name}
                </Text>
              </Pressable>
            ))}
          </View>
          <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={styles.list}>
            {messages.length === 0 ? (
              <View style={styles.welcome}>
                <Mascot size={96} />
                <DisplayTextView text={zh('你好！点下面的问题问我吧', 'nǐ hǎo diǎn xià miàn de wèn tí wèn wǒ ba')} size={20} />
              </View>
            ) : null}
            {messages.map((m, i) => (
              <View key={i} style={[styles.msg, m.role === 'user' ? styles.mine : styles.theirs]} testID={`msg-${m.role}`}>
                <Text style={styles.msgText}>{m.content}</Text>
                {m.role === 'assistant' ? <SpeakerButton item={{ text: m.content, lang: 'zh-CN', cloud: true }} size={36} color={colors.parent} /> : null}
              </View>
            ))}
            {loading ? <ActivityIndicator color={colors.parent} style={{ margin: space.md }} /> : null}
            {error ? (
              <View testID="teacher-error">
                <Notice tone="warn" text={error} />
              </View>
            ) : null}
          </ScrollView>
          {/* 横向滚动条不要撑满剩余高度（V2.17 修正：之前按钮被拉成又高又大的椭圆） */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickBar}
            contentContainerStyle={styles.quick}
          >
            {QUICK[subject].map((q) => (
              <Pressable key={q} onPress={() => send(q)} style={styles.chip} accessibilityRole="button" testID="quick-question">
                <Text style={styles.chipText}>{q}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {showMic ? (
            <View style={styles.pad} testID="voice-input">
              {listening ? (
                <View style={styles.listenBox} testID="voice-listening">
                  <Text style={styles.listenTitle}>{voice.state === 'starting' ? '准备好了就说吧……' : voice.state === 'thinking' ? '星星宝在想……' : '🎤 我在听，请说……'}</Text>
                  <Text style={styles.listenText} testID="voice-partial">{voice.partial || ' '}</Text>
                </View>
              ) : null}
              {voice.problem ? (
                <Text style={styles.voiceTip} testID="voice-problem">
                  {VOICE_PROBLEM_TEXT[voice.problem]}
                </Text>
              ) : null}
              <Pressable
                onPress={() => {
                  if (voice.state === 'listening') voice.stop();
                  else if (voice.state === 'idle' && !loading) {
                    stopSpeaking();
                    voice.start();
                  }
                }}
                disabled={loading || voice.state === 'starting' || voice.state === 'thinking'}
                style={[styles.micBtn, listening && styles.micOn, loading && { opacity: 0.5 }]}
                accessibilityRole="button"
                accessibilityLabel={voice.state === 'listening' ? '说完了' : '点我说话'}
                testID="voice-mic"
              >
                <Text style={styles.micText}>{voice.state === 'listening' ? '✋ 说完了' : '🎤 点我说话'}</Text>
              </Pressable>
            </View>
          ) : null}
          <View style={[styles.inputRow, styles.pad]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="打字提问"
              maxLength={100}
              style={styles.input}
              onSubmitEditing={() => send(input)}
              testID="teacher-input"
            />
            <Pressable onPress={() => send(input)} style={styles.sendBtn} accessibilityRole="button" testID="teacher-send">
              <Text style={styles.sendText}>发送</Text>
            </Pressable>
          </View>
          <Text style={styles.note}>AI 回答可能出错</Text>
        </>
      )}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.parentSoft },
  pad: { paddingHorizontal: space.lg },
  tabs: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg, marginTop: space.sm },
  tab: { flex: 1, minHeight: 48, borderRadius: radius.round, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 16, fontWeight: '600', color: colors.text },
  list: { padding: space.lg, gap: space.sm },
  welcome: { alignItems: 'center', gap: space.md, paddingVertical: space.xl },
  msg: { maxWidth: '88%', borderRadius: radius.md, padding: space.md, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.highlight },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.card },
  msgText: { flexShrink: 1, fontSize: 18, lineHeight: 26, color: colors.text },
  quickBar: { flexGrow: 0, flexShrink: 0 },
  quick: { paddingHorizontal: space.lg, gap: space.sm, paddingVertical: space.sm, alignItems: 'center' },
  chip: {
    minHeight: MIN_TOUCH - 8,
    paddingHorizontal: space.lg,
    borderRadius: radius.round,
    backgroundColor: colors.parent,
    justifyContent: 'center',
  },
  chipText: { color: colors.onAccent, fontSize: 16, fontWeight: '600' },
  micBtn: {
    minHeight: 64,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  micOn: { backgroundColor: colors.wrong },
  micText: { color: colors.onAccent, fontSize: 22, fontWeight: '700' },
  listenBox: { backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, marginBottom: space.sm, gap: 4 },
  listenTitle: { fontSize: 16, fontWeight: '600', color: colors.parent },
  listenText: { fontSize: 20, color: colors.text, minHeight: 28 },
  voiceTip: { fontSize: 14, color: colors.wrong, marginBottom: space.xs, lineHeight: 20 },
  inputRow: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  input: { flex: 1, minHeight: 48, backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: space.md, fontSize: 16, color: colors.text },
  sendBtn: { minHeight: 48, paddingHorizontal: space.lg, borderRadius: radius.md, backgroundColor: colors.parent, justifyContent: 'center' },
  sendText: { color: colors.onAccent, fontSize: 16, fontWeight: '600' },
  note: { fontSize: 11, color: colors.textSoft, textAlign: 'center', paddingHorizontal: space.lg, marginTop: 4 },
}));
