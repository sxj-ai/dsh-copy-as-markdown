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

## 结构

```
package.json       # dsh.bundle.patch + dsh.client 声明
cordis.patch.yml   # 插入 copy-as-markdown 行
lib/index.js       # host 半部（无操作，仅为装配服务）
lib/client.js      # 浏览器半部：按钮 + Markdown 转换 + 剪贴板
```
