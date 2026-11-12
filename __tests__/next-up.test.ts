/** “接着学”（V4.2）：每科下一步学什么；提前合成朗读 */
import { lessonsFor } from '@/content';
import { createEmptyProgress, type ProgressState } from '@/progress/model';
import { nextUp } from '@/progress/nextUp';
import { _resetPrefetchPause, prefetchSpeech, setCloudVoice, speakablesOf } from '@/speech/speech';

const NOW = new Date(2026, 10, 13, 10).getTime();
const done = (s: ProgressState, ids: string[]) => {
  for (const id of ids) s.lessons[id] = { completedCount: 1, bestStars: 3, lastCompletedAt: NOW - 86400000 } as unknown as ProgressState['lessons'][string];
  return s;
};

describe('接着学', () => {
  it('没学过：从这一科第一节课开始', () => {
    const n = nextUp(createEmptyProgress(), 'math', NOW)!;
    expect(n.kind).toBe('lesson');
    expect(n.route).toEqual({ name: 'lesson', id: lessonsFor('math')[0].id });
  });

  it('学到一半的课优先，接着上次', () => {
    const s = createEmptyProgress();
    const l = lessonsFor('chinese')[0];
    s.active = { lessonId: l.id, stepIndex: 2 } as ProgressState['active'];
    expect(nextUp(s, 'chinese', NOW)).toMatchObject({ kind: 'resume', route: { name: 'lesson', id: l.id, resume: true } });
  });

  it('第一节学完后不再指向它：给下一节没学过的课，课都学完了给知识点练习', () => {
    const math = lessonsFor('math');
    const s = done(createEmptyProgress(), math.map((l) => l.id));
    const n = nextUp(s, 'math', NOW)!;
    expect(n.kind).toBe('new');
    expect(n.route.name).toBe('practice');
    expect((n.route as { id: string }).id).toMatch(/^kp:m1\./);

    const zh = lessonsFor('chinese');
    const s2 = done(createEmptyProgress(), [zh[0].id]);
    expect(nextUp(s2, 'chinese', NOW)).toMatchObject({ kind: 'lesson', route: { name: 'lesson', id: zh[1].id } });
  });
});

describe('提前合成朗读', () => {
  afterEach(() => {
    setCloudVoice(null);
    _resetPrefetchPause();
  });

  it('只合成没有录音的句子，同一句不重复请求；没开云端童声时什么都不做', async () => {
    const q = { prompt: { speak: { text: '九加八等于几？', lang: 'zh-CN' as const } }, listen: { text: 'apple pie', lang: 'en-US' as const } };
    expect(speakablesOf(q).map((x) => x.text)).toEqual(['九加八等于几？', 'apple pie']);
    prefetchSpeech(speakablesOf(q)); // 没开：不报错
    const fetcher = jest.fn(async () => 'https://oss.example/x.mp3');
    setCloudVoice(fetcher);
    prefetchSpeech([...speakablesOf(q), ...speakablesOf(q), undefined, { text: '  ', lang: 'zh-CN' }]);
    expect(fetcher).toHaveBeenCalledTimes(2);
    prefetchSpeech([{ text: '你真聪明', lang: 'zh-CN', cloud: true }]); // 星星宝的回答不提前合成
    expect(fetcher).toHaveBeenCalledTimes(2);
    await new Promise((r) => setTimeout(r, 0));
  });

  it('合成服务失败后歇一会儿，不每道题都重试', async () => {
    const fetcher = jest.fn(async () => {
      throw new Error('501');
    });
    setCloudVoice(fetcher);
    prefetchSpeech([{ text: '七加六等于几？', lang: 'zh-CN' }]);
    await new Promise((r) => setTimeout(r, 0));
    prefetchSpeech([{ text: '八加五等于几？', lang: 'zh-CN' }, { text: '九加四等于几？', lang: 'zh-CN' }]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    _resetPrefetchPause();
    prefetchSpeech([{ text: '八加五等于几？', lang: 'zh-CN' }]);
    expect(fetcher).toHaveBeenCalledTimes(2);
    await new Promise((r) => setTimeout(r, 0));
  });
});
