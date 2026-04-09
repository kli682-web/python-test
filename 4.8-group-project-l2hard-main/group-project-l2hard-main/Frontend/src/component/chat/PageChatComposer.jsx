import { Image as ImageIcon, Loader2, Mic, Send, Smile } from 'lucide-react';

export default function PageChatComposer({
  activeSessionId,
  inputValue,
  isLoading,
  onChange,
  onSubmit,
}) {
  return (
    // 🟢 修改：移动端外边距缩小为 p-4，电脑端恢复 p-8
    <div className="z-10 shrink-0 p-4 pt-2 md:p-8 md:pt-2">
      {/* 🟢 修改：移动端减小内部的 padding (px-3 py-2) 和 元素间距 (gap-2) */}
      <div className="focus-within:ring-2 flex items-center gap-2 md:gap-4 rounded-full border border-white/10 bg-[#a0522d] px-3 py-2 md:px-6 md:py-3 shadow-xl ring-orange-300 transition-all">
        <Mic
          size={20}
          // 🟢 修改：增加 shrink-0，防止在极窄屏幕下图标被挤压变形
          className="shrink-0 cursor-pointer text-white/60 transition-colors hover:text-white"
        />
        <input
          type="text"
          value={inputValue}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onSubmit();
            }
          }}
          disabled={isLoading}
          placeholder={
            activeSessionId
              ? 'Reply with your food, drink, or total budget...'
              : 'Try: salad and lemon tea under $20'
          }
          // 🟢 修改：增加了 min-w-0 和 text-ellipsis。
          // 这样当手机屏幕太小，占位符(placeholder)文字太长时会自动变成省略号，而不会把右边的发送按钮挤出屏幕。
          className="flex-1 min-w-0 text-ellipsis border-none bg-transparent text-sm text-white outline-none placeholder:text-white/50 disabled:cursor-not-allowed disabled:opacity-70"
        />
        {/* 🟢 修改：右侧图标区域也减小间距，并加上 shrink-0 保持按钮形状 */}
        <div className="flex shrink-0 items-center gap-2 md:gap-4 text-white/60">
          <Smile size={20} className="cursor-pointer hover:text-white" />
          <ImageIcon size={20} className="cursor-pointer hover:text-white" />
          <button
            onClick={onSubmit}
            disabled={!inputValue.trim() || isLoading}
            className="rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}