type DividerProps = {
  className?: string;
};

export function Divider({ className = "" }: DividerProps) {
  return <hr className={`border-t border-hairline ${className}`} />;
}
