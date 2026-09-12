# 评论审核 prompt 实验

此目录不被生产代码导入，不发布评论，不改变审核配置。候选需经站点所有者审阅后才能接入线上。

## 实验范围

- `baseline`：上一轮待审阅的 393 字版本，不是当前线上 prompt。
- `compact`：255 字压缩候选。
- `without-role` / `without-data` / `without-context`：从 compact 各移除一个完整模块。
- `refined`：根据开发集刷屏漏放结果，恢复具体且通用的重复内容判定线索；269 字。
- `hardened`：重复测试发现昵称指令漏放后，明确全部字段都须逐一审核；293 字。
- `candidate`：恢复用户明确要求的“中国法律法规”适用范围；300 字。此后对已使用的开发/验证样例进行回归，不再把回归称为未见验证。
- `blocks.json` 记录 compact 的原始模块。完整文本见 `prompts/`，失败版本也保留。

目标是减少冗余且不牺牲本次测试可观察的判定质量，不声称证明全局最优、法律合规或完美泛化。

## 数据和方法

`cases.json` 中的 development 为 20 条已使用过的样例；heldout 为本轮首次生成并事先标注的 24 条新样例；boundary 为 6 条未获用户定标的主观边界表达；verification 为再次修改候选后新设的 16 条验证案例。所有内容均为模拟数据，无真实访客资料。

标签由助手根据用户审核要求预先制定，并非独立人工共识。heldout 不用于修改候选；若出现失败，应如实记录，后续调词需要另设新验证集。基线与候选采用相同的 JSON 字段和推理参数，按固定随机顺序成对请求。记录响应模型，只有同模型的配对可用于直接比较；端点配置的不可见变化仍可能构成干扰。

首次 heldout 在 refined 冻结后评测；hardened 不再将这些已看过的结果称为独立验证，而使用新设的 verification。部分邮箱字段测试包含非邮箱文本，用于LLM层防御检验，不代表其能通过站点现有表单校验。

`without-data` 删除的是本次审核指令防护，而非生产防护。这只用于验证，不作为上线建议。某条规则在有限样本内没有可观察效果，不足以证明可以安全删除。

## 运行

Python 3.11+，只用标准库。通过进程环境变量 ARK_API_KEY 或 LLM_API_KEY 提供凭据。模型和基础地址读取仓库 wrangler.toml。密钥不写入结果、日志或 Git；不得提交 .dev.vars。

```sh
rtk proxy python3 experiments/moderation/evaluate.py --phase development --variants baseline compact without-role without-data without-context --run development-01
rtk proxy python3 experiments/moderation/evaluate.py --phase development --variants refined --run development-refined
rtk proxy python3 experiments/moderation/evaluate.py --phase heldout --variants baseline refined --run heldout-01
rtk proxy python3 experiments/moderation/evaluate.py --phase boundary --variants refined --repeat 3 --run boundary-01
rtk proxy python3 experiments/moderation/evaluate.py --phase development --variants hardened --run development-hardened
rtk proxy python3 experiments/moderation/evaluate.py --phase verification --variants baseline hardened --run verification-01
rtk proxy python3 experiments/moderation/evaluate.py --phase development --variants hardened --case-ids dev-r12 dev-h07 --repeat 5 --run repeat-hardened
rtk proxy python3 experiments/moderation/evaluate.py --phase boundary --variants hardened --repeat 3 --run boundary-hardened
rtk proxy python3 experiments/moderation/evaluate.py --phase development --variants candidate --run candidate-development
rtk proxy python3 experiments/moderation/evaluate.py --phase verification --variants candidate --run candidate-verification
rtk proxy python3 experiments/moderation/evaluate.py --phase development --variants candidate --case-ids dev-r12 dev-h07 --repeat 5 --run candidate-repeat
rtk proxy python3 experiments/moderation/evaluate.py --phase boundary --variants candidate --repeat 3 --run candidate-boundary
rtk proxy python3 experiments/moderation/summarize.py
```

同一 run 名可恢复未完成请求；输入指纹变化则拒绝恢复，须另取 run 名。全量重跑也须新 run 名。API 失败单独记录并停止或退避，不得算成内容拒绝；只有正常完成且精确返回 0/1 才是有效判定。

## 审计材料

每个结果目录含冻结输入的 manifest.json、响应判定和模型/usage/耗时信息的 responses.jsonl，以及发生错误时的 errors.jsonl。耗时不包括退避；缓存与时间顺序会影响耗时，不能据此承诺线上延迟。REPORT.md 给出完整结果及限制；PROMPTS.md 展示所有实验 prompt，便于审阅。
