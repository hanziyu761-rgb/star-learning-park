/**
 * 问问星星宝：AI 老师对话。
 * 孩子主要点“快捷问题”，也可以由家长帮忙输入；回复会自动朗读。
 * 语音输入（说话提问）需要原生语音识别，尚未实现。
 */
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
import { speak, stopSpeaking } from '@/speech/speech';
import { colors, MIN_TOUCH, radius, space, subjectTheme } from '@/theme';

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
  const { aiEnabled, aiBaseUrl, grade } = state.settings;
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
      const reply = await aiChat({ enabled: aiEnabled, baseUrl: aiBaseUrl }, { subject, grade, messages: next });
      setMessages([...next, { role: 'assistant', content: reply }]);
      speak({ text: reply, lang: subject === 'english' && /^[\x00-\x7F\s]+$/.test(reply) ? 'en-US' : 'zh-CN' });
    } catch (e) {
      const msg = e instanceof AiError ? e.message : AI_ERROR_TEXT.SERVER;
      setError(msg);
      speak({ text: msg, lang: 'zh-CN' });
    } finally {
      setLoading(false);
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 100);
    }
  };

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
                <Text style={[styles.tabText, subject === s && { color: '#fff' }]}>
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
                {m.role === 'assistant' ? <SpeakerButton item={{ text: m.content, lang: 'zh-CN' }} size={36} color={colors.parent} /> : null}
              </View>
            ))}
            {loading ? <ActivityIndicator color={colors.parent} style={{ margin: space.md }} /> : null}
            {error ? (
              <View testID="teacher-error">
                <Notice tone="warn" text={error} />
              </View>
            ) : null}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quick}>
            {QUICK[subject].map((q) => (
              <Pressable key={q} onPress={() => send(q)} style={styles.chip} accessibilityRole="button" testID="quick-question">
                <Text style={styles.chipText}>{q}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={[styles.inputRow, styles.pad]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="也可以请爸爸妈妈帮忙打字提问"
              maxLength={100}
              style={styles.input}
              onSubmitEditing={() => send(input)}
              testID="teacher-input"
            />
            <Pressable onPress={() => send(input)} style={styles.sendBtn} accessibilityRole="button" testID="teacher-send">
              <Text style={styles.sendText}>发送</Text>
            </Pressable>
          </View>
          <Text style={styles.note}>AI 回答由 DeepSeek 生成，可能出错，仅供学习参考。不会记录孩子的个人信息。</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F1FF' },
  pad: { paddingHorizontal: space.lg },
  tabs: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg, marginTop: space.sm },
  tab: { flex: 1, minHeight: 48, borderRadius: radius.round, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 16, fontWeight: '800', color: colors.text },
  list: { padding: space.lg, gap: space.sm },
  welcome: { alignItems: 'center', gap: space.md, paddingVertical: space.xl },
  msg: { maxWidth: '88%', borderRadius: radius.md, padding: space.md, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.star },
  theirs: { alignSelf: 'flex-start', backgroundColor: '#fff' },
  msgText: { flexShrink: 1, fontSize: 18, lineHeight: 26, color: colors.text },
  quick: { paddingHorizontal: space.lg, gap: space.sm, paddingVertical: space.sm },
  chip: {
    minHeight: MIN_TOUCH - 8,
    paddingHorizontal: space.lg,
    borderRadius: radius.round,
    backgroundColor: colors.parent,
    justifyContent: 'center',
  },
  chipText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  inputRow: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  input: { flex: 1, minHeight: 48, backgroundColor: '#fff', borderRadius: radius.md, paddingHorizontal: space.md, fontSize: 16 },
  sendBtn: { minHeight: 48, paddingHorizontal: space.lg, borderRadius: radius.md, backgroundColor: colors.parent, justifyContent: 'center' },
  sendText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  note: { fontSize: 11, color: colors.textSoft, textAlign: 'center', paddingHorizontal: space.lg, marginTop: 4 },
});
