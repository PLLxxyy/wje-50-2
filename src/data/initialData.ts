import type { Group, Word } from '../types';

export const defaultGroups: Group[] = [
  { id: 'work', name: '工作术语', icon: '💼', color: '#1e3a5f' },
  { id: 'friends', name: '朋友昵称', icon: '👥', color: '#2dd4bf' },
  { id: 'rare', name: '生僻字', icon: '📚', color: '#fb923c' },
  { id: 'meme', name: '网络梗', icon: '🎮', color: '#a78bfa' },
];

export const sampleWords: Word[] = [
  {
    id: 'sample1',
    correct: '按部就班',
    mistakes: ['按步就班'],
    pinyin: 'abjb',
    scene: '形容做事按照一定的条理和顺序',
    groupId: 'work',
    createdAt: Date.now() - 86400000 * 7,
    reviewCount: 3,
    correctCount: 2,
  },
  {
    id: 'sample2',
    correct: '部署',
    mistakes: ['布署'],
    pinyin: 'bs',
    scene: '安排、布置工作任务',
    groupId: 'work',
    createdAt: Date.now() - 86400000 * 6,
    reviewCount: 2,
    correctCount: 2,
  },
  {
    id: 'sample3',
    correct: '川流不息',
    mistakes: ['穿流不息'],
    pinyin: 'clbx',
    scene: '形容行人、车马等像水流一样连续不断',
    groupId: 'work',
    createdAt: Date.now() - 86400000 * 5,
    reviewCount: 1,
    correctCount: 0,
  },
  {
    id: 'sample4',
    correct: '小明',
    mistakes: ['小名'],
    pinyin: 'xm',
    scene: '朋友名字，避免写错成"小名"',
    groupId: 'friends',
    createdAt: Date.now() - 86400000 * 4,
    reviewCount: 0,
    correctCount: 0,
  },
  {
    id: 'sample5',
    correct: '小红',
    mistakes: ['小宏', '小洪'],
    pinyin: 'xh',
    scene: '朋友名字，常见错写',
    groupId: 'friends',
    createdAt: Date.now() - 86400000 * 3,
    reviewCount: 0,
    correctCount: 0,
  },
  {
    id: 'sample6',
    correct: '赟',
    mistakes: [''],
    pinyin: 'y',
    scene: '读作yūn，美好、文武全才之意，用于人名',
    groupId: 'rare',
    createdAt: Date.now() - 86400000 * 2,
    reviewCount: 0,
    correctCount: 0,
  },
  {
    id: 'sample7',
    correct: '淼',
    mistakes: [''],
    pinyin: 'm',
    scene: '读作miǎo，形容水大，用于人名或店名',
    groupId: 'rare',
    createdAt: Date.now() - 86400000,
    reviewCount: 0,
    correctCount: 0,
  },
  {
    id: 'sample8',
    correct: 'YYDS',
    mistakes: ['yyds'],
    pinyin: 'yyds',
    scene: '永远的神，网络流行语，表示赞美',
    groupId: 'meme',
    createdAt: Date.now(),
    reviewCount: 0,
    correctCount: 0,
  },
  {
    id: 'sample9',
    correct: '破防',
    mistakes: ['破房'],
    pinyin: 'pf',
    scene: '指心理防线被突破，感到感动或难过',
    groupId: 'meme',
    createdAt: Date.now(),
    reviewCount: 0,
    correctCount: 0,
  },
  {
    id: 'sample10',
    correct: '再接再厉',
    mistakes: ['再接再励'],
    pinyin: 'zyjl',
    scene: '继续努力，不要松懈',
    groupId: 'work',
    createdAt: Date.now() - 86400000 * 10,
    reviewCount: 5,
    correctCount: 4,
  },
];

export const importTemplate = `[
  {
    "correct": "正确写法",
    "mistakes": ["常见错法1", "常见错法2"],
    "pinyin": "拼音首字母",
    "scene": "使用场景说明",
    "groupId": "work"
  }
]

分组ID说明：
- work: 工作术语
- friends: 朋友昵称
- rare: 生僻字
- meme: 网络梗
`;
