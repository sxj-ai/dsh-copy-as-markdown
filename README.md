# dsh-copy-as-markdown

在 DSH Web 会话头部工具条添加一个「复制为 Markdown」按钮。点击后会把当前会话的
**用户与助手正文（包含代码块）** 转成 Markdown 并复制到剪贴板，方便粘贴到 TXT 文件或
另一个聊天会话中（对应 Codex 的 *Copy as Markdown*）。

- 纯对话模式：不包含工具调用、工具结果、slash 命令、压缩标记等中间内容；
  助手侧正文（DSH 把推理文本渲染为可见正文）一并保留
- 自动加载旧历史：会话被窗口分页截断时，会先展开全部旧页再复制（上限 500 页防死循环）
- 剪贴板：优先 `navigator.clipboard`，降级 `execCommand("copy")`
- 界面文案提供 zh/en 两套 locale
- 输出结构：`# DSH Session` + 按顺序的 `## User` / `## Assistant` 段落（`---` 分隔）

## 安装

```bash
# 开发态（免重启，当前 web 进程立即生效）
dev_inject_plugin {"dir": "C:/Users/86134/.dsh/plugins/dsh-copy-as-markdown"}

# 持久化（写 profile package.json + junction，重启后由 bundles 正常装配）
dev_install_package {"dir": "C:/Users/86134/.dsh/plugins/dsh-copy-as-markdown"}
```

## 手动装配（等价持久化）

把 `"@dsh-external/dsh-copy-as-markdown"` 加入
`~/.dsh/profiles/web/package.json` 的 `dsh.profile.bundles`，并在 dependencies 中加入
`"@dsh-external/dsh-copy-as-markdown": "link:C:/Users/86134/.dsh/plugins/dsh-copy-as-markdown"`，
然后重建 `profiles/web/node_modules` 下的 junction 或重新 `npm install`，重启 `dsh web`。

## 本地更新与 GitHub 同步

仓库根目录自带两个辅助脚本（只影响 Git 提交，不影响插件运行）：

- `.\sync.ps1 "更新说明"` —— **手动一键**：自动 `git add + commit + push`，推荐日常使用；
  不带参数时自动生成时间戳提交信息；没有改动时会提示已一致。
- `.\watch.ps1` —— **全自动**：挂在后台，每 3 秒检测改动，发现改动自动提交并推送
  （Ctrl+C 停止；推送失败会自动重试）。注意：全自动会把调试过程中的中间改动也提交，
  想要"满意了再存档"请用 `sync.ps1`。

也可以在仓库根目录执行 `git sync "更新说明"`（等效于 `.\sync.ps1`，本机已配置该别名）。

检查本地与 GitHub 是否一致：

```powershell
git status
# 显示 "Your branch is up to date with 'origin/main'" 且 "nothing to commit, working tree clean"
# = 本地与 GitHub 完全一致
```

查看历史：`git log --oneline --graph -10`，或在 GitHub 仓库页面的 **Commits** 标签查看。

回滚已发布的内容：`git revert <提交号>`（生成反向提交、保留历史，最安全）。

## 结构

```
package.json       # dsh.bundle.patch + dsh.client 声明
cordis.patch.yml   # 插入 copy-as-markdown 行
lib/index.js       # host 半部（无操作，仅为装配服务）
lib/client.js      # 浏览器半部：按钮 + Markdown 转换 + 剪贴板
```
