export default function Card({ className = '', hover = false, children, ...props }) {
  return (
    <div
      className={[
        'card p-6',
        hover ? 'transition duration-300 hover:-translate-y-1 hover:shadow-pop' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
