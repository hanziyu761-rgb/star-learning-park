/**
 * 一台手机多个孩子（V5.4）：
 * - 家长中心 · 设置 · 孩子：添加、改名、切换、删除（删除会删掉这个孩子的学习记录，要点两次确认）
 * - 首页顶部：有两个及以上孩子时显示头像，点一下切换
 */
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { Card, SectionTitle } from '@/components/ui';
import { ALL_GRADES, GRADE_CN } from '@/progress/grade';
import { FIRST_PROFILE, MAX_PROFILES, PROFILE_EMOJIS } from '@/progress/profiles';
import { useProgress } from '@/progress/ProgressContext';
import { colors, radius, space, themed } from '@/theme';

export function ProfileSwitcher() {
  const { profiles, switchProfile } = useProgress();
  if (profiles.list.length < 2) return null;
  return (
    <View style={styles.switcher} testID="profile-switcher">
      {profiles.list.map((p) => {
        const on = p.id === profiles.active;
        return (
          <Pressable
            key={p.id}
            onPress={() => switchProfile(p.id)}
            style={[styles.avatar, on && styles.avatarOn]}
            accessibilityRole="button"
            accessibilityLabel={`切换到${p.name}`}
            accessibilityState={{ selected: on }}
            testID={`profile-${p.id}`}
          >
            <Text style={styles.avatarEmoji}>{p.emoji}</Text>
            <Text style={[styles.avatarName, on && { color: colors.onAccent }]} numberOfLines={1}>
              {p.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ChildrenCard() {
  const { profiles, state, switchProfile, addProfile, renameProfile, removeProfile } = useProgress();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(PROFILE_EMOJIS[1]);
  const [grade, setGrade] = useState(1);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const full = profiles.list.length >= MAX_PROFILES;

  return (
    <Card>
      <SectionTitle>👨‍👩‍👧 孩子</SectionTitle>
      <Text style={styles.small}>一台手机可以给几个孩子用，每个孩子有自己的年级、学习记录、错题本和护眼计时。会员按手机算，几个孩子都能用。</Text>
      <View style={{ gap: space.sm, marginTop: space.sm }} testID="children-list">
        {profiles.list.map((p) => {
          const active = p.id === profiles.active;
          return (
            <View key={p.id} style={styles.row} testID={`child-${p.id}`}>
              <Text style={styles.rowEmoji}>{p.emoji}</Text>
              {editing === p.id ? (
                <TextInput value={editName} onChangeText={setEditName} style={[styles.input, { flex: 1 }]} maxLength={8} testID={`child-name-input-${p.id}`} />
              ) : (
                <Text style={styles.rowName} numberOfLines={1}>
                  {p.name}
                  {active ? <Text style={styles.tag}>{`  当前 · ${GRADE_CN[state.settings.grade]}年级`}</Text> : null}
                </Text>
              )}
              {editing === p.id ? (
                <SmallBtn
                  text="保存"
                  onPress={() => {
                    renameProfile(p.id, editName);
                    setEditing(null);
                  }}
                  testID={`child-save-${p.id}`}
                />
              ) : (
                <>
                  {!active ? <SmallBtn text="切换" onPress={() => switchProfile(p.id)} testID={`child-switch-${p.id}`} /> : null}
                  <SmallBtn
                    text="改名"
                    alt
                    onPress={() => {
                      setEditing(p.id);
                      setEditName(p.name);
                    }}
                    testID={`child-rename-${p.id}`}
                  />
                  {p.id !== FIRST_PROFILE ? (
                    <SmallBtn
                      text={confirmDel === p.id ? '确认删除' : '删除'}
                      danger={confirmDel === p.id}
                      alt={confirmDel !== p.id}
                      onPress={async () => {
                        if (confirmDel !== p.id) {
                          setConfirmDel(p.id);
                          setMsg(`再点一次“确认删除”会删掉 ${p.name} 的全部学习记录，不能恢复。`);
                          return;
                        }
                        setConfirmDel(null);
                        setMsg('');
                        await removeProfile(p.id);
                      }}
                      testID={`child-delete-${p.id}`}
                    />
                  ) : null}
                </>
              )}
            </View>
          );
        })}
      </View>
      {msg ? <Text style={[styles.small, { color: colors.wrong }]}>{msg}</Text> : null}

      {full ? (
        <Text style={styles.small}>{`最多 ${MAX_PROFILES} 个孩子。`}</Text>
      ) : (
        <View style={{ marginTop: space.md, gap: space.sm }}>
          <Text style={styles.label}>添加一个孩子</Text>
          <TextInput value={name} onChangeText={setName} placeholder="名字（最多 8 个字）" placeholderTextColor={colors.textFaint} maxLength={8} style={styles.input} testID="child-new-name" />
          <View style={styles.chips}>
            {PROFILE_EMOJIS.map((e) => (
              <Pressable key={e} onPress={() => setEmoji(e)} style={[styles.emojiChip, emoji === e && styles.chipOn]} accessibilityRole="button" testID={`child-new-emoji-${e}`}>
                <Text style={styles.emojiText}>{e}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.chips}>
            {ALL_GRADES.map((g) => (
              <Pressable key={g} onPress={() => setGrade(g)} style={[styles.chip, grade === g && styles.chipOn]} accessibilityRole="button" testID={`child-new-grade-${g}`}>
                <Text style={[styles.chipText, grade === g && { color: colors.onAccent }]}>{GRADE_CN[g]}年级</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={async () => {
              const id = await addProfile(name, emoji, grade);
              if (id) {
                setName('');
                setMsg('');
              } else setMsg('请先填名字。');
            }}
            style={styles.btn}
            accessibilityRole="button"
            testID="child-add"
          >
            <Text style={styles.btnText}>添加并切换到这个孩子</Text>
          </Pressable>
        </View>
      )}
    </Card>
  );
}

function SmallBtn({ text, onPress, alt, danger, testID }: { text: string; onPress: () => void; alt?: boolean; danger?: boolean; testID: string }) {
  return (
    <Pressable onPress={onPress} style={[styles.smallBtn, alt && styles.smallBtnAlt, danger && { backgroundColor: colors.wrong }]} accessibilityRole="button" testID={testID}>
      <Text style={[styles.smallBtnText, alt && { color: colors.parent }]}>{text}</Text>
    </Pressable>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    switcher: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
    avatar: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: radius.round, paddingVertical: 6, paddingHorizontal: space.md, maxWidth: 160 },
    avatarOn: { backgroundColor: colors.parent },
    avatarEmoji: { fontSize: 22, color: colors.text },
    avatarName: { fontSize: 16, fontWeight: '600', color: colors.text, flexShrink: 1 },
    small: { fontSize: 13, color: colors.textSoft, lineHeight: 19, marginTop: 4 },
    label: { fontSize: 16, fontWeight: '600', color: colors.text },
    row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 44 },
    rowEmoji: { fontSize: 24, color: colors.text },
    rowName: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
    tag: { fontSize: 13, fontWeight: '400', color: colors.textSoft },
    input: { minHeight: 44, borderRadius: radius.md, backgroundColor: colors.parentSoft, paddingHorizontal: space.md, fontSize: 15, color: colors.text },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
    chip: { paddingHorizontal: space.md, minHeight: 40, borderRadius: radius.round, backgroundColor: colors.parentSoft, justifyContent: 'center' },
    chipOn: { backgroundColor: colors.parent },
    chipText: { fontSize: 14, fontWeight: '600', color: colors.text },
    emojiChip: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.parentSoft, alignItems: 'center', justifyContent: 'center' },
    emojiText: { fontSize: 22, color: colors.text },
    btn: { minHeight: 48, borderRadius: radius.md, backgroundColor: colors.parent, alignItems: 'center', justifyContent: 'center' },
    btnText: { color: colors.onAccent, fontSize: 16, fontWeight: '600' },
    smallBtn: { minHeight: 36, paddingHorizontal: space.md, borderRadius: radius.round, backgroundColor: colors.parent, justifyContent: 'center' },
    smallBtnAlt: { backgroundColor: colors.parentSoft },
    smallBtnText: { color: colors.onAccent, fontSize: 14, fontWeight: '600' },
  }),
);
