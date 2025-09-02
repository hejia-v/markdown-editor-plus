import {
  App,
  ItemView,
  MarkdownView,
  Notice,
  Plugin,
  WorkspaceLeaf,
  Editor,
  addIcon,
} from "obsidian";
  
  const VIEW_TYPE_EDITOR_PLUS = "markdown-editor-plus-view";
  
  export default class MarkdownEditorPlusPlugin extends Plugin {
  async onload() {
    // 注册自定义图标
    this.registerCustomIcon();
    
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

    private registerCustomIcon() {
      // 添加自定义 SVG 图标
      const iconId = "markdown-editor-plus-icon";
      
      // 使用 Obsidian 的 addIcon API 注册图标
      addIcon(iconId, `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#6366f1" stroke="#4f46e5" stroke-width="2"/>
        <path d="M20 35 L20 65 L25 65 L25 45 L35 60 L40 60 L50 45 L50 65 L55 65 L55 35 L45 35 L37.5 50 L30 35 Z" fill="white"/>
        <circle cx="75" cy="25" r="12" fill="#10b981" stroke="#059669" stroke-width="1.5"/>
        <path d="M71 25 L79 25 M75 21 L75 29" stroke="white" stroke-width="2" stroke-linecap="round"/>
        <g transform="translate(60, 55)">
          <path d="M2 18 L6 14 L14 22 L10 26 Z" fill="#f59e0b" stroke="#d97706" stroke-width="1"/>
          <path d="M6 14 L14 6 L18 10 L10 18 Z" fill="#fbbf24" stroke="#d97706" stroke-width="1"/>
          <path d="M8 12 L12 8 L14 10 L10 14 Z" fill="#fef3c7"/>
        </g>
        <circle cx="30" cy="20" r="2" fill="white" opacity="0.8"/>
        <circle cx="70" cy="75" r="1.5" fill="white" opacity="0.6"/>
      </svg>`);
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

  getIcon() {
    return "markdown-editor-plus-icon";
  }
  
    async onOpen() {
      const container = this.containerEl.children[1];
      container.empty();
  
    // 添加自定义样式
    this.addStyles();

    // 创建主容器
    const mainContainer = container.createEl("div", { cls: "editor-plus-container" });

    // 标题区域已移除

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

    // 删除所有分割线
    const btnRemoveDividers = editButtons.createEl("button", {
      cls: "editor-plus-btn edit-btn danger-btn"
    });
    btnRemoveDividers.innerHTML = `
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M5 12h14M5 12l-4-4M5 12l-4 4"/>
      </svg>
      <span>删除所有分割线</span>
    `;
    btnRemoveDividers.onclick = () => this.removeAllDividers();

    // 删除当前行
    const btnDeleteCurrentLine = editButtons.createEl("button", {
      cls: "editor-plus-btn edit-btn danger-btn"
    });
    btnDeleteCurrentLine.innerHTML = `
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 6h18"/>
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
        <path d="M8 6V4c0-1 1-2 2-2h4c0-1 1-2 2-2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
      </svg>
      <span>删除光标所在行</span>
    `;
    btnDeleteCurrentLine.onclick = () => this.deleteCurrentLine();

    // 删除选中区域所在行
    const btnDeleteSelectedLines = editButtons.createEl("button", {
      cls: "editor-plus-btn edit-btn danger-btn"
    });
    btnDeleteSelectedLines.innerHTML = `
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 6h18"/>
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
        <path d="M8 6V4c0-1 1-2 2-2h4c0-1 1-2 2-2v2"/>
        <path d="M9 9l6 6"/>
        <path d="M15 9l-6 6"/>
      </svg>
      <span>删除选中区域所在行</span>
    `;
    btnDeleteSelectedLines.onclick = () => this.deleteSelectedLines();

    // 删除所有行尾空白
    const btnTrimWhitespace = editButtons.createEl("button", {
      cls: "editor-plus-btn edit-btn danger-btn"
    });
    btnTrimWhitespace.innerHTML = `
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
      <span>删除所有行尾空白</span>
    `;
    btnTrimWhitespace.onclick = () => this.removeTrailingWhitespace();
  

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
        background: transparent;
        border-radius: 8px;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 24px;
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

      
      const result = this.getActiveEditor();
      if (!result) {

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

          new Notice("已选中下一个粗体");
          return;
        }

        new Notice("没有下一个粗体了");
      } else {
        const prevMatch = [...matches].reverse().find(m => m.to < cursorOffset);
        if (prevMatch) {
          const fromPos = editor.offsetToPos(prevMatch.from);
          const toPos = editor.offsetToPos(prevMatch.to);
          editor.setSelection(fromPos, toPos);
          this.focusEditor(view, editor, fromPos);

          new Notice("已选中上一个粗体");
          return;
        }

        new Notice("没有上一个粗体了");
      }
    }
  
        /** 取消全部粗体 */
    removeAllBold() {

      
      const result = this.getActiveEditor();
      if (!result) {

        new Notice("请打开一个 Markdown 文件并切换到编辑模式");
        return;
      }
      const { editor, view } = result;
      let content = editor.getValue();
  
      const boldCount = (content.match(/\*\*(.+?)\*\*/g) || []).length;
      if (boldCount === 0) {

        new Notice("未找到粗体");
        return;
      }
  
            content = content.replace(/\*\*(.+?)\*\*/g, "$1");

      editor.setValue(content);
      this.focusEditor(view, editor);

      new Notice(`已取消 ${boldCount} 处粗体`);
    }
  
        /** 取消当前选中的粗体 */
    removeSelectedBold() {

      
      const result = this.getActiveEditor();
      if (!result) {

        new Notice("请打开一个 Markdown 文件并切换到编辑模式");
        return;
      }
      const { editor, view } = result;
      const sel = editor.getSelection();

      if (!sel || !sel.startsWith("**") || !sel.endsWith("**")) {

        new Notice("当前未正确选中粗体文本");
        return;
      }

      const unbold = sel.replace(/^\*\*(.+)\*\*$/, "$1");
      const cursorPos = editor.getCursor();
      editor.replaceSelection(unbold);
      this.focusEditor(view, editor, cursorPos);

      new Notice("已取消当前选中的粗体");
    }

    /** 删除所有分割线 */
    removeAllDividers() {

      
      const result = this.getActiveEditor();
      if (!result) {

        new Notice("请打开一个 Markdown 文件并切换到编辑模式");
        return;
      }
      const { editor, view } = result;
      let content = editor.getValue();

      // 匹配只包含 "---" 的行（忽略行首和行尾的空白字符）
      const dividerRegex = /^\s*---\s*$/gm;
      const matches = content.match(dividerRegex);
      const dividerCount = matches ? matches.length : 0;
      
      if (dividerCount === 0) {

        new Notice("未找到分割线");
        return;
      }

      // 删除所有匹配的分割线行
      content = content.replace(dividerRegex, '');

      editor.setValue(content);
      this.focusEditor(view, editor);

      new Notice(`已删除 ${dividerCount} 条分割线`);
    }

    /** 删除光标所在行 */
    deleteCurrentLine() {

      
      const result = this.getActiveEditor();
      if (!result) {

        new Notice("请打开一个 Markdown 文件并切换到编辑模式");
        return;
      }
      const { editor, view } = result;
      
      // 获取当前光标位置
      const cursorPos = editor.getCursor();
      const currentLineNumber = cursorPos.line;
      
      // 获取当前行的内容
      const currentLineContent = editor.getLine(currentLineNumber);
      
      // 获取文档总行数
      const totalLines = editor.lineCount();
      
      // 确定删除范围
      let deleteFrom: { line: number; ch: number };
      let deleteTo: { line: number; ch: number };
      
      if (totalLines === 1) {
        // 如果只有一行，清空内容但保留行
        deleteFrom = { line: 0, ch: 0 };
        deleteTo = { line: 0, ch: currentLineContent.length };
      } else if (currentLineNumber === totalLines - 1) {
        // 如果是最后一行，删除前面的换行符
        deleteFrom = { line: currentLineNumber - 1, ch: editor.getLine(currentLineNumber - 1).length };
        deleteTo = { line: currentLineNumber, ch: currentLineContent.length };
      } else {
        // 删除当前行及其后面的换行符
        deleteFrom = { line: currentLineNumber, ch: 0 };
        deleteTo = { line: currentLineNumber + 1, ch: 0 };
      }
      
      // 执行删除
      editor.replaceRange("", deleteFrom, deleteTo);
      
      // 调整光标位置
      let newCursorPos: { line: number; ch: number };
      if (totalLines === 1) {
        // 如果原来只有一行，光标移到开头
        newCursorPos = { line: 0, ch: 0 };
      } else if (currentLineNumber === totalLines - 1) {
        // 如果删除的是最后一行，光标移到新的最后一行的末尾
        const newLastLine = Math.max(0, currentLineNumber - 1);
        newCursorPos = { line: newLastLine, ch: editor.getLine(newLastLine).length };
      } else {
        // 光标移到下一行的开头（现在占据了被删除行的位置）
        newCursorPos = { line: currentLineNumber, ch: 0 };
      }
      
      editor.setCursor(newCursorPos);
      this.focusEditor(view, editor, newCursorPos);

      new Notice("已删除光标所在行");
    }

    /** 删除所有行尾空白 */
    removeTrailingWhitespace() {

      
      const result = this.getActiveEditor();
      if (!result) {

        new Notice("请打开一个 Markdown 文件并切换到编辑模式");
        return;
      }
      const { editor, view } = result;
      let content = editor.getValue();

      // 保存当前光标位置
      const cursorPos = editor.getCursor();
      
      // 统计处理的行数
      const lines = content.split('\n');
      let processedLines = 0;
      
      // 删除每行末尾的空白字符（空格和制表符）
      const processedContent = lines.map(line => {
        const trimmedLine = line.replace(/[ \t]+$/, '');
        if (trimmedLine !== line) {
          processedLines++;
        }
        return trimmedLine;
      }).join('\n');

      if (processedLines === 0) {

        new Notice("未找到行尾空白字符");
        return;
      }

      editor.setValue(processedContent);
      this.focusEditor(view, editor, cursorPos);

      new Notice(`已删除 ${processedLines} 行的行尾空白`);
    }

    /** 删除选中区域所在的整行 */
    deleteSelectedLines() {

      
      const result = this.getActiveEditor();
      if (!result) {

        new Notice("请打开一个 Markdown 文件并切换到编辑模式");
        return;
      }
      const { editor, view } = result;
      
      // 获取选中区域
      const selection = editor.getSelection();
      if (!selection) {

        new Notice("请先选择要删除的文本区域");
        return;
      }
      
      // 获取选中区域的起始和结束位置
      const selectionStart = editor.getCursor("from");
      const selectionEnd = editor.getCursor("to");
      
      // 检查是否跨越多行
      if (selectionStart.line === selectionEnd.line) {

        new Notice("选中区域必须跨越多行才能使用此功能");
        return;
      }
      
      // 确定要删除的行范围
      const startLine = selectionStart.line;
      const endLine = selectionEnd.line;
      const totalLines = editor.lineCount();
      
      // 计算删除范围
      let deleteFrom: { line: number; ch: number };
      let deleteTo: { line: number; ch: number };
      
      if (startLine === 0 && endLine === totalLines - 1) {
        // 如果选中了所有行，清空文档但保留一个空行
        deleteFrom = { line: 0, ch: 0 };
        deleteTo = { line: totalLines - 1, ch: editor.getLine(totalLines - 1).length };
        editor.replaceRange("", deleteFrom, deleteTo);
        editor.setCursor({ line: 0, ch: 0 });
      } else if (endLine === totalLines - 1) {
        // 如果包含最后一行，需要删除前一行的换行符
        deleteFrom = { line: startLine - 1, ch: editor.getLine(startLine - 1).length };
        deleteTo = { line: endLine, ch: editor.getLine(endLine).length };
        editor.replaceRange("", deleteFrom, deleteTo);
        // 光标移到删除区域的前一行末尾
        const newLine = Math.max(0, startLine - 1);
        editor.setCursor({ line: newLine, ch: editor.getLine(newLine).length });
      } else {
        // 删除选中行及其后的换行符
        deleteFrom = { line: startLine, ch: 0 };
        deleteTo = { line: endLine + 1, ch: 0 };
        editor.replaceRange("", deleteFrom, deleteTo);
        // 光标移到删除区域的开始位置
        editor.setCursor({ line: startLine, ch: 0 });
      }
      
      const deletedLinesCount = endLine - startLine + 1;
      this.focusEditor(view, editor);

      new Notice(`已删除选中区域所在的 ${deletedLinesCount} 行`);
    }
  
    async onClose() {
      this.containerEl.empty();
      // 清理自定义样式（可选，因为其他实例可能还在使用）
      // const styleEl = document.querySelector('#editor-plus-styles');
      // if (styleEl) styleEl.remove();
    }
  }
  