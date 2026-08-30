window.__ModuleLoader__.load({
	id: "@dsh-external/dsh-copy-as-markdown",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		const react = require("react");
		const { createElement: h, useState } = react;

		// ── Locale ────────────────────────────────────────────────────────────
		const NS = "copy-as-markdown";
		const zh = {
			"action.copy": "复制为 Markdown",
			"action.loading": "正在加载…",
			"action.copied": "已复制",
			"action.failed": "复制失败",
			"action.empty": "没有可复制的对话内容",
			"action.hint": "把当前会话（用户 + 助手正文与代码块）复制为 Markdown 到剪贴板"
		};
		const en = {
			"action.copy": "Copy as Markdown",
			"action.loading": "Loading…",
			"action.copied": "Copied",
			"action.failed": "Copy failed",
			"action.empty": "Nothing to copy",
			"action.hint": "Copy this session (user + assistant text and code blocks) as Markdown to the clipboard"
		};

		// ── Owned styles (removed with the fiber by the client module loader) ──
		const css = ".camd-button{border:1px solid var(--dsw-alias-border-l2);min-width:130px;height:32px;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family);cursor:pointer;background:0 0;border-radius:18px;justify-content:center;align-items:center;gap:4px;padding:6px 12px;font-size:13px;font-weight:400;line-height:20px;display:inline-flex}.camd-button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.camd-button:disabled{color:var(--dsw-alias-label-dimmed);cursor:wait}";
		const tagId = "@dsh-external/dsh-copy-as-markdown/button.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-external/dsh-copy-as-markdown";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}

		// ── Clipboard ────────────────────────────────────────────────────────
		async function copyText(text) {
			if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
				await navigator.clipboard.writeText(text);
				return;
			}
			const textarea = document.createElement("textarea");
			textarea.value = text;
			textarea.style.position = "fixed";
			textarea.style.opacity = "0";
			textarea.style.pointerEvents = "none";
			document.body.appendChild(textarea);
			textarea.select();
			const ok = document.execCommand("copy");
			textarea.remove();
			if (!ok) throw new Error("execCommand copy rejected");
		}

		// ── Markdown projection (clean mode: user + assistant text only) ─────
		function contentBlocksToText(blocks) {
			const parts = [];
			for (const block of blocks ?? []) {
				if (!block || typeof block !== "object") continue;
				if (block.type === "text" && block.text) {
					parts.push(block.text);
				} else if (block.type === "image") {
					const name = block.attachment?.name;
					parts.push(name ? `[图片: ${name}]` : "[图片]");
				}
				// clean mode: reasoning / tool-call / tool-result excluded
			}
			return parts.join("\n");
		}

		function assistantBlocksToText(blocks) {
			const parts = [];
			for (const block of blocks ?? []) {
				if (!block || typeof block !== "object") continue;
				if (block.kind === "text" && block.text) {
					parts.push(block.text);
				} else if (block.kind === "reasoning" && block.text) {
					// DSH renders reasoning as the assistant's visible body in this
					// surface; keep it in a clean transcript so the copy carries the
					// assistant's actual content.
					parts.push(block.text);
				} else if (block.kind === "image") {
					const name = block.attachment?.name;
					parts.push(name ? `[图片: ${name}]` : "[图片]");
				}
				// clean mode: tool-call / other excluded
			}
			return parts.join("\n");
		}

		function renderTranscript(nodes) {
			const parts = [];
			for (const node of nodes ?? []) {
				if (!node || typeof node !== "object") continue;
				if (node.kind === "user" || node.kind === "steering") {
					const body = contentBlocksToText(node.content);
					if (body) parts.push("## User\n\n" + body + "\n");
				} else if (node.kind === "assistant") {
					const body = assistantBlocksToText(node.blocks);
					if (body) parts.push("## Assistant\n\n" + body + "\n");
				}
				// clean mode: context / command / tool-result / compaction skipped
			}
			if (parts.length === 0) return "";
			return "# DSH Session\n\n" + parts.join("\n\n---\n\n") + "\n";
		}

		// ── React component: header action ───────────────────────────────────
		function CopyAsMarkdownButton(props) {
			const [status, setStatus] = useState("idle");
			const t = props.t ?? ((key) => key);
			const sessionFace = props.sessionFace;
			const busy = status === "loading";
			const label = busy
				? t("action.loading")
				: status === "copied"
					? t("action.copied")
					: status === "failed"
						? t("action.failed")
						: t("action.copy");

			async function handleCopy() {
				if (!sessionFace || busy) return;
				setStatus("loading");
				try {
					let snapshot = sessionFace.getSnapshot();
					if (!snapshot || !Array.isArray(snapshot.nodes)) throw new Error("session not open");

					// Expand the history window so "copy whole session" really copies everything.
					let guard = 0;
					while (snapshot.hasMore && snapshot.openState === "open" && guard < 500) {
						const previous = snapshot.nodes.length;
						await sessionFace.loadOlder();
						snapshot = sessionFace.getSnapshot();
						guard += 1;
						// Stale/no-progress guard: never spin forever on an older-page no-op.
						if (snapshot.nodes.length === previous && snapshot.hasMore) break;
					}

					const md = renderTranscript(snapshot.nodes);
					if (!md) {
						setStatus("failed");
						return;
					}
					await copyText(md);
					setStatus("copied");
				} catch (error) {
					console.warn("copy-as-markdown:", error);
					setStatus("failed");
				} finally {
					window.setTimeout(() => setStatus("idle"), 2500);
				}
			}

			return h("button", {
				type: "button",
				className: "camd-button",
				disabled: busy,
				"aria-busy": busy,
				title: t("action.hint"),
				onClick: handleCopy
			}, label);
		}

		// ── Cordis client plugin ─────────────────────────────────────────────
		const inject = ["slots", "locale", "sessions"];

		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "copy-as-markdown: locale");
			ctx.effect(() => ctx.slots.inject(
				"conversation.session.header.utilities",
				() => ctx.slots.register({
					name: "conversation.session.header.utilities",
					id: "copy-as-markdown",
					locale: NS,
					inject: (sessionId) => ({
						sessionFace: ctx.sessions.binding(sessionId)?.session
					})
				}, CopyAsMarkdownButton)
			), "copy-as-markdown: session header utility");
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
