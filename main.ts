import {
    App,
    ItemView,
    MarkdownView,
    Notice,
    Plugin,
    WorkspaceLeaf,
    Editor,
  } from "obsidian";
  
  const VIEW_TYPE_EDITOR_PLUS = "markdown-editor-plus-view";
  
  export default class MarkdownEditorPlusPlugin extends Plugin {
    async onload() {
      // 注册侧边栏视图
      this.registerView(
        VIEW_TYPE_EDITOR_PLUS,
        (leaf) => new EditorPlusView(leaf, this.app)
      );
  
      // 提供命令打开工具面板
      this.addCommand({
        id: "open-markdown-editor-plus",
        name: "打开 Markdown Editor Plus 工具",
        callback: () => this.activateView()
      });
  
      // 启动时自动打开
      this.app.workspace.onLayoutReady(() => {
        this.activateView();
      });
        }

    onunload() {
      this.app.workspace.detachLeavesOfType(VIEW_TYPE_EDITOR_PLUS);
    }

    async activateView() {
      this.app.workspace.detachLeavesOfType(VIEW_TYPE_EDITOR_PLUS);
      
      const leaf = this.app.workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({
          type: VIEW_TYPE_EDITOR_PLUS,
          active: true,
        });

        this.app.workspace.revealLeaf(
          this.app.workspace.getLeavesOfType(VIEW_TYPE_EDITOR_PLUS)[0]
        );
      }
    }
  }
  
  class EditorPlusView extends ItemView {
    app: App;
  private statusIndicator: HTMLElement | null = null;
  
    constructor(leaf: WorkspaceLeaf, app: App) {
      super(leaf);
      this.app = app;
    }

    private getActiveEditor(): { editor: Editor; view: MarkdownView } | null {
      // 首先尝试获取当前活跃的 Markdown 视图
      let view = this.app.workspace.getActiveViewOfType(MarkdownView);
      
      // 如果当前没有活跃的 Markdown 视图（可能焦点在插件面板上），
      // 则查找最近的 Markdown 视图
      if (!view) {
        const markdownLeaves = this.app.workspace.getLeavesOfType("markdown");
        if (markdownLeaves.length > 0) {
          // 获取最后一个（最近的）Markdown 叶子
          const mostRecentLeaf = markdownLeaves[markdownLeaves.length - 1];
          view = mostRecentLeaf.view as MarkdownView;
        }
      }
      
      if (!view) {
        return null;
      }
      
      // 尝试多种方式获取编辑器
      let editor = null;
      
      // 方法1: 直接获取 editor 属性
      if ((view as any).editor) {
        editor = (view as any).editor;
      }
      
      // 方法2: 通过 sourceMode 获取
      if (!editor && (view as any).sourceMode?.cmEditor) {
        editor = (view as any).sourceMode.cmEditor;
      }
      
      // 方法3: 通过 editMode 获取
      if (!editor && (view as any).editMode?.editor) {
        editor = (view as any).editMode.editor;
      }
      
      // 方法4: 检查是否在源码模式
      if (!editor) {
        const mode = (view as any).getMode?.();
        if (mode === "source") {
          editor = (view as any).editor || (view as any).sourceMode?.cmEditor;
        }
      }
      
      return editor ? { editor, view } : null;
    }

    private focusEditor(view: MarkdownView, editor: Editor, position?: { line: number; ch: number }) {
      // 聚焦到 Markdown 视图
      this.app.workspace.setActiveLeaf(view.leaf, { focus: true });
      
      // 如果提供了位置，则移动光标
      if (position) {
        editor.setCursor(position);
      }
      
      // 确保编辑器获得焦点
      setTimeout(() => {
        editor.focus();
      }, 50);
    }
  
    getViewType() {
      return VIEW_TYPE_EDITOR_PLUS;
    }
  
    getDisplayText() {
      return "Markdown Editor Plus";
    }
  
    async onOpen() {
      const container = this.containerEl.children[1];
      container.empty();
  
    // 添加自定义样式
    this.addStyles();

    // 创建主容器
    const mainContainer = container.createEl("div", { cls: "editor-plus-container" });

    // 创建标题区域
    const headerSection = mainContainer.createEl("div", { cls: "editor-plus-header" });
    const titleEl = headerSection.createEl("h2", { 
      text: "Markdown Editor Plus",
      cls: "editor-plus-title"
    });
    
    // 添加副标题
    headerSection.createEl("p", {
      text: "粗体文本管理工具",
      cls: "editor-plus-subtitle"
    });

    // 创建功能区域
    const functionsSection = mainContainer.createEl("div", { cls: "editor-plus-functions" });

    // 导航功能组
    const navGroup = functionsSection.createEl("div", { cls: "function-group" });
    navGroup.createEl("h3", { text: "导航功能", cls: "group-title" });
    
    const navButtons = navGroup.createEl("div", { cls: "button-row" });
  
      // 查找上一个粗体
    const btnPrev = navButtons.createEl("button", { 
      cls: "editor-plus-btn nav-btn prev-btn"
    });
    btnPrev.innerHTML = `
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 18l-6-6 6-6"/>
      </svg>
      <span>上一个</span>
    `;
      btnPrev.onclick = () => this.findBold("prev");
  
      // 查找下一个粗体
    const btnNext = navButtons.createEl("button", { 
      cls: "editor-plus-btn nav-btn next-btn"
    });
    btnNext.innerHTML = `
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18l6-6-6-6"/>
      </svg>
      <span>下一个</span>
    `;
      btnNext.onclick = () => this.findBold("next");

    // 编辑功能组
    const editGroup = functionsSection.createEl("div", { cls: "function-group" });
    editGroup.createEl("h3", { text: "编辑功能", cls: "group-title" });
    
    const editButtons = editGroup.createEl("div", { cls: "button-column" });

    // 取消当前选中粗体
    const btnRemoveCurrent = editButtons.createEl("button", {
      cls: "editor-plus-btn edit-btn current-btn"
    });
    btnRemoveCurrent.innerHTML = `
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
      <span>取消当前粗体</span>
    `;
    btnRemoveCurrent.onclick = () => this.removeSelectedBold();
  
      // 取消全部粗体
    const btnRemove = editButtons.createEl("button", { 
      cls: "editor-plus-btn edit-btn danger-btn"
    });
    btnRemove.innerHTML = `
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>
      </svg>
      <span>取消全部粗体</span>
    `;
      btnRemove.onclick = () => this.removeAllBold();
  
    // 添加状态指示器
    const statusSection = mainContainer.createEl("div", { cls: "editor-plus-status" });
    this.statusIndicator = statusSection.createEl("div", { 
      text: "就绪",
      cls: "status-indicator ready"
    });
  }

  private updateStatus(message: string, type: 'ready' | 'working' | 'success' | 'error' = 'ready') {
    if (this.statusIndicator) {
      this.statusIndicator.textContent = message;
      this.statusIndicator.className = `status-indicator ${type}`;
      
      // 自动重置状态
      if (type === 'success' || type === 'error') {
        setTimeout(() => {
          this.updateStatus("就绪", 'ready');
        }, 3000);
      }
    }
  }

  private addStyles() {
    // 检查是否已经添加了样式
    if (document.querySelector('#editor-plus-styles')) {
      return;
    }

    const styleEl = document.createElement('style');
    styleEl.id = 'editor-plus-styles';
    styleEl.textContent = `
      .editor-plus-container {
        padding: 20px 16px;
        font-family: var(--font-interface);
        background: var(--background-primary);
        border-radius: 8px;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .editor-plus-header {
        text-align: center;
        padding-bottom: 16px;
        border-bottom: 2px solid var(--background-modifier-border);
      }

      .editor-plus-title {
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--text-normal);
        background: linear-gradient(135deg, var(--text-accent), var(--text-accent-hover));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .editor-plus-subtitle {
        margin: 0;
        font-size: 13px;
        color: var(--text-muted);
        font-weight: 400;
      }

      .editor-plus-functions {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .function-group {
        background: var(--background-secondary);
        border-radius: 8px;
        padding: 16px;
        border: 1px solid var(--background-modifier-border);
        transition: all 0.2s ease;
      }

      .function-group:hover {
        border-color: var(--text-accent);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .group-title {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--text-normal);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .group-title::before {
        content: "";
        width: 3px;
        height: 14px;
        background: var(--text-accent);
        border-radius: 2px;
      }

      .button-row {
        display: flex;
        gap: 8px;
      }

      .button-column {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .editor-plus-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 16px;
        border: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
        color: var(--text-normal);
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
      }

      .editor-plus-btn::before {
        content: "";
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
        transition: left 0.5s ease;
      }

      .editor-plus-btn:hover::before {
        left: 100%;
      }

      .editor-plus-btn:hover {
        border-color: var(--text-accent);
        background: var(--background-modifier-hover);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }

      .editor-plus-btn:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .btn-icon {
        width: 16px;
        height: 16px;
        stroke-width: 2;
        transition: transform 0.2s ease;
      }

      .editor-plus-btn:hover .btn-icon {
        transform: scale(1.1);
      }

      .nav-btn {
        flex: 1;
        background: linear-gradient(135deg, var(--background-primary), var(--background-secondary));
      }

      .prev-btn:hover {
        background: linear-gradient(135deg, #4f46e5, #6366f1);
        color: white;
        border-color: #4f46e5;
      }

      .next-btn:hover {
        background: linear-gradient(135deg, #059669, #10b981);
        color: white;
        border-color: #059669;
      }

      .edit-btn {
        justify-content: flex-start;
      }

      .current-btn:hover {
        background: linear-gradient(135deg, #d97706, #f59e0b);
        color: white;
        border-color: #d97706;
      }

      .danger-btn:hover {
        background: linear-gradient(135deg, #dc2626, #ef4444);
        color: white;
        border-color: #dc2626;
      }

      .editor-plus-status {
        padding: 12px;
        background: var(--background-secondary);
        border-radius: 6px;
        border: 1px solid var(--background-modifier-border);
      }

      .status-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        font-weight: 500;
      }

      .status-indicator.ready {
        color: var(--text-success);
      }

      .status-indicator.working {
        color: var(--text-accent);
      }

      .status-indicator.success {
        color: var(--text-success);
      }

      .status-indicator.error {
        color: var(--text-error);
      }

      .status-indicator.ready::before,
      .status-indicator.working::before,
      .status-indicator.success::before,
      .status-indicator.error::before {
        content: "";
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .status-indicator.ready::before {
        background: var(--text-success);
        animation: pulse 2s infinite;
      }

      .status-indicator.working::before {
        background: var(--text-accent);
        animation: spin 1s linear infinite;
      }

      .status-indicator.success::before {
        background: var(--text-success);
        animation: flash 0.5s ease-in-out;
      }

      .status-indicator.error::before {
        background: var(--text-error);
        animation: shake 0.5s ease-in-out;
      }

      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      @keyframes flash {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.2); }
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-2px); }
        75% { transform: translateX(2px); }
      }

      .dark .editor-plus-container {
        background: var(--background-primary);
      }

      .dark .function-group {
        background: var(--background-primary-alt);
        border-color: var(--background-modifier-border-hover);
      }

      .dark .editor-plus-btn {
        background: var(--background-secondary);
        border-color: var(--background-modifier-border-hover);
      }

      @media (max-width: 300px) {
        .button-row {
          flex-direction: column;
        }
        
        .editor-plus-container {
          padding: 16px 12px;
        }
      }
    `;
    
    document.head.appendChild(styleEl);
    }
  
        /** 查找上一个/下一个粗体 */
    findBold(direction: "prev" | "next") {
      this.updateStatus("正在查找...", 'working');
      
      const result = this.getActiveEditor();
      if (!result) {
        this.updateStatus("需要打开 Markdown 文件", 'error');
        new Notice("请打开一个 Markdown 文件并切换到编辑模式");
        return;
      }
      const { editor, view } = result;
      const content = editor.getValue();
      const cursorOffset = editor.posToOffset(editor.getCursor());
  
      const regex = /\*\*(.+?)\*\*/g;
      let match;
      const matches: { from: number; to: number }[] = [];
  
      while ((match = regex.exec(content)) !== null) {
        matches.push({ from: match.index, to: regex.lastIndex });
      }
  
      if (matches.length === 0) {
        this.updateStatus("未找到粗体文本", 'error');
        new Notice("没有粗体文本");
        return;
      }
  
      if (direction === "next") {
        const nextMatch = matches.find(m => m.from > cursorOffset);
        if (nextMatch) {
          const fromPos = editor.offsetToPos(nextMatch.from);
          const toPos = editor.offsetToPos(nextMatch.to);
          editor.setSelection(fromPos, toPos);
          this.focusEditor(view, editor, fromPos);
          this.updateStatus("已选中下一个粗体", 'success');
          new Notice("已选中下一个粗体");
          return;
        }
        this.updateStatus("已到达最后一个", 'error');
        new Notice("没有下一个粗体了");
      } else {
        const prevMatch = [...matches].reverse().find(m => m.to < cursorOffset);
        if (prevMatch) {
          const fromPos = editor.offsetToPos(prevMatch.from);
          const toPos = editor.offsetToPos(prevMatch.to);
          editor.setSelection(fromPos, toPos);
          this.focusEditor(view, editor, fromPos);
          this.updateStatus("已选中上一个粗体", 'success');
          new Notice("已选中上一个粗体");
          return;
        }
        this.updateStatus("已到达第一个", 'error');
        new Notice("没有上一个粗体了");
      }
    }
  
        /** 取消全部粗体 */
    removeAllBold() {
      this.updateStatus("正在处理...", 'working');
      
      const result = this.getActiveEditor();
      if (!result) {
        this.updateStatus("需要打开 Markdown 文件", 'error');
        new Notice("请打开一个 Markdown 文件并切换到编辑模式");
        return;
      }
      const { editor, view } = result;
      let content = editor.getValue();
  
      const boldCount = (content.match(/\*\*(.+?)\*\*/g) || []).length;
      if (boldCount === 0) {
        this.updateStatus("未找到粗体文本", 'error');
        new Notice("未找到粗体");
        return;
      }
  
            content = content.replace(/\*\*(.+?)\*\*/g, "$1");

      editor.setValue(content);
      this.focusEditor(view, editor);
      this.updateStatus(`已取消 ${boldCount} 处粗体`, 'success');
      new Notice(`已取消 ${boldCount} 处粗体`);
    }
  
        /** 取消当前选中的粗体 */
    removeSelectedBold() {
      this.updateStatus("正在处理选中文本...", 'working');
      
      const result = this.getActiveEditor();
      if (!result) {
        this.updateStatus("需要打开 Markdown 文件", 'error');
        new Notice("请打开一个 Markdown 文件并切换到编辑模式");
        return;
      }
      const { editor, view } = result;
      const sel = editor.getSelection();

      if (!sel || !sel.startsWith("**") || !sel.endsWith("**")) {
        this.updateStatus("未选中粗体文本", 'error');
        new Notice("当前未正确选中粗体文本");
        return;
      }

      const unbold = sel.replace(/^\*\*(.+)\*\*$/, "$1");
      const cursorPos = editor.getCursor();
      editor.replaceSelection(unbold);
      this.focusEditor(view, editor, cursorPos);
      this.updateStatus("已取消选中的粗体", 'success');
      new Notice("已取消当前选中的粗体");
    }
  
    async onClose() {
      this.containerEl.empty();
      // 清理自定义样式（可选，因为其他实例可能还在使用）
      // const styleEl = document.querySelector('#editor-plus-styles');
      // if (styleEl) styleEl.remove();
    }
  }
  