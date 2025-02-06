
interface BookReactionsProps {
  userReactions?: string[];
  onReaction: (reactionName: string) => void;
}

const REACTIONS = [
  { emoji: "👍", name: "thumbsup" },
  { emoji: "❤️", name: "heart" },
  { emoji: "😄", name: "smile" },
  { emoji: "🤓", name: "nerd" },
  { emoji: "📚", name: "book" },
];

export function BookReactions({ userReactions = [], onReaction }: BookReactionsProps) {
  return (
    <div className="flex gap-2">
      {REACTIONS.map(({ emoji, name }) => (
        <button
          key={name}
          onClick={() => onReaction(name)}
          className={`text-2xl transition-transform hover:scale-110 ${
            userReactions.includes(name) ? 'opacity-100' : 'opacity-50'
          }`}
          aria-label={`${userReactions.includes(name) ? 'Remove' : 'Add'} ${name} reaction`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
