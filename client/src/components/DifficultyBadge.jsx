// 文章难度徽章：入门 / 进阶 / 高级 / 深入
export default function DifficultyBadge({ difficulty }) {
  const d = difficulty ?? 50;
  let label;
  let cls;
  if (d <= 20) {
    label = '入门';
    cls = 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
  } else if (d <= 55) {
    label = '进阶';
    cls = 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300';
  } else if (d <= 80) {
    label = '高级';
    cls = 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300';
  } else {
    label = '深入';
    cls = 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300';
  }
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${cls}`}>
      {label} Lv.{d}
    </span>
  );
}
