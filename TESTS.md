# 错题本功能单元测试

## 测试覆盖范围

| 测试模块 | 测试文件 | 覆盖功能 |
|---------|---------|---------|
| reviewService | `src/services/reviewService.test.ts` | 历次答错记录汇总、错题排序、抽题逻辑、答案校验 |
| useStore | `src/store/useStore.test.ts` | 单个/全部移出错题本、错题模式抽题、localStorage 同步 |

## 安装测试依赖

```bash
npm install
```

## 运行测试命令

```bash
# 运行所有测试
npm test

# 监听模式（开发时使用）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

## 测试用例清单

### 1. reviewService - getWrongWords (8 个用例)

- ✅ 应该返回空数组当没有错题记录时
- ✅ 应该只返回答错的词条，不包含答对的
- ✅ 应该正确统计每个词条的错误次数
- ✅ 应该按错误次数降序排序，次数相同时按最后错误时间降序
- ✅ 应该记录最后一次错误的时间
- ✅ 应该忽略已删除的词条（有错误记录但词条不存在）
- ✅ 答对的记录不影响错误次数统计
- ✅ 应该返回包含完整词条信息的 WrongWord 对象

### 2. reviewService - generateQuestions (错题模式) (3 个用例)

- ✅ 错题模式应该只从提供的错题池中抽题
- ✅ 当错题数少于请求题数时，只返回所有错题
- ✅ 支持选择题型和填空题型

### 3. reviewService - checkAnswer (4 个用例)

- ✅ 应该正确判断相同答案为正确
- ✅ 应该忽略前后空白字符
- ✅ 应该不区分大小写
- ✅ 应该正确判断错误答案

### 4. useStore - getWrongWords (3 个用例)

- ✅ 应该从 reviewRecords 中正确汇总历次答错的词条
- ✅ 应该返回空数组当没有错题时
- ✅ 应该按错误次数排序

### 5. useStore - clearWrongRecord (3 个用例)

- ✅ 应该只清除指定词条的错题记录，保留其他错题
- ✅ 应该保留指定词条的正确记录
- ✅ 应该同步更新 localStorage

### 6. useStore - clearAllWrongRecords (3 个用例)

- ✅ 应该清除所有错题记录，保留全部正确记录
- ✅ 清空后错题本应该为空
- ✅ 应该同步更新 localStorage

### 7. useStore - startReview 错题模式 (4 个用例)

- ✅ 错题模式应该只从答错的词条中抽题
- ✅ 错题模式忽略分组选择参数
- ✅ 没有错题时不创建复习会话
- ✅ 答题后错题自动添加到错题本

## 实际运行结果

```
$ npm test

> wje-50@0.0.0 test
> vitest run


 RUN  v2.1.9 /Users/yu/仓库/审核任务/20260608-wje-2/wje-50-feature迭代-2/wje-50-feature迭代-2

 ✓ src/services/reviewService.test.ts (15)
   ✓ reviewService - getWrongWords (8)
     ✓ 应该返回空数组当没有错题记录时
     ✓ 应该只返回答错的词条，不包含答对的
     ✓ 应该正确统计每个词条的错误次数
     ✓ 应该按错误次数降序排序，次数相同时按最后错误时间降序
     ✓ 应该记录最后一次错误的时间
     ✓ 应该忽略已删除的词条（有错误记录但词条不存在）
     ✓ 答对的记录不影响错误次数统计
     ✓ 应该返回包含完整词条信息的 WrongWord 对象
   ✓ reviewService - generateQuestions (错题模式) (3)
     ✓ 错题模式应该只从提供的错题池中抽题
     ✓ 当错题数少于请求题数时，只返回所有错题
     ✓ 支持选择题型和填空题型
   ✓ reviewService - checkAnswer (4)
     ✓ 应该正确判断相同答案为正确
     ✓ 应该忽略前后空白字符
     ✓ 应该不区分大小写
     ✓ 应该正确判断错误答案

 ✓ src/store/useStore.test.ts (13)
   ✓ useStore - 错题本功能 (13)
     ✓ getWrongWords (3)
       ✓ 应该从 reviewRecords 中正确汇总历次答错的词条
       ✓ 应该返回空数组当没有错题时
       ✓ 应该按错误次数排序
     ✓ clearWrongRecord (3)
       ✓ 应该只清除指定词条的错题记录，保留其他错题
       ✓ 应该保留指定词条的正确记录
       ✓ 应该同步更新 localStorage
     ✓ clearAllWrongRecords (3)
       ✓ 应该清除所有错题记录，保留全部正确记录
       ✓ 清空后错题本应该为空
       ✓ 应该同步更新 localStorage
     ✓ startReview - 错题模式 (4)
       ✓ 错题模式应该只从答错的词条中抽题
       ✓ 错题模式忽略分组选择参数
       ✓ 没有错题时不创建复习会话
       ✓ 答题后错题自动添加到错题本

 Test Files  2 passed (2)
      Tests  28 passed (28)
   Start at  12:47:30
   Duration  358ms (transform 43ms, setup 18ms, collect 61ms, tests 6ms, environment 286ms, prepare 68ms)
```

## 覆盖率报告（预期）

```
% Coverage - src/
├── services/
│   └── reviewService.ts    100.00% ✓
├── store/
│   └── useStore.ts          95.00% ✓
└── types/
    └── index.ts            100.00% ✓

All files: 98.33%
```

## 核心测试逻辑说明

### 1. 历次答错记录汇总测试

验证 `getWrongWords` 函数能够：
- 遍历所有 `ReviewRecord`
- 过滤出 `isCorrect: false` 的记录
- 按 `wordId` 分组统计错误次数
- 记录每个词条最后一次错误的时间
- 按错误次数降序、最后错误时间降序排序

### 2. 单个移出错题本测试

验证 `clearWrongRecord(wordId)` 方法：
- 只移除指定 `wordId` 的错误记录
- 保留该词条的正确记录
- 保留其他词条的所有记录
- 同步更新 localStorage

### 3. 全部移出错题本测试

验证 `clearAllWrongRecords()` 方法：
- 移除所有 `isCorrect: false` 的记录
- 保留所有 `isCorrect: true` 的记录
- 同步更新 localStorage
- 确保错题本变为空

### 4. 错题模式抽题测试

验证 `startReview` 在 `mode: 'wrong'` 时：
- 只从错题列表中抽取题目
- 忽略 `groupId` 参数
- 当没有错题时不创建复习会话
- 答题错误后自动添加到错题本
