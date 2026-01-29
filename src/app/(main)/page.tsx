export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome to the Community</h1>
      <p className="text-muted-foreground">
        This is your community dashboard. Features coming soon:
      </p>
      <ul className="list-disc list-inside text-muted-foreground space-y-2">
        <li>Activity feed with posts and discussions</li>
        <li>Courses and learning content</li>
        <li>Events calendar</li>
        <li>Member directory</li>
        <li>Points and leaderboards</li>
      </ul>
    </div>
  );
}
