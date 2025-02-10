
interface BookReactionsProps {
  userReactions?: string[];
  reactions?: { [key: string]: number };
  onReaction: (reactionName: string) => void;
}

const REACTIONS = [
  { emoji: "👍", name: "thumbsup" },
  { emoji: "❤️", name: "heart" },
  { emoji: "😄", name: "smile" },
  { emoji: "🤓", name: "nerd" },
  { emoji: "📚", name: "book" },
];

export function BookReactions({ userReactions = [], reactions = {}, onReaction }: BookReactionsProps) {
  return (
    <div className="flex gap-2">
      {REACTIONS.map(({ emoji, name }) => (
        <button
          key={name}
          onClick={() => onReaction(name)}
          className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all hover:bg-accent ${
            userReactions.includes(name) ? 'opacity-100' : 'opacity-50'
          }`}
          aria-label={`${userReactions.includes(name) ? 'Remove' : 'Add'} ${name} reaction`}
        >
          <span className="text-xl">{emoji}</span>
          {(reactions[name] ?? 0) > 0 && (
            <span className="text-sm font-medium">{reactions[name]}</span>
          )}
        </button>
      ))}
    </div>
  );
}
