import { Link } from "react-router-dom";
import Layout from "@/components/Layout";

const NotFound = () => (
  <Layout>
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="mb-2 font-display text-5xl font-bold">404</h1>
      <p className="mb-6 text-muted-foreground">That tool doesn’t exist (or has moved).</p>
      <Link to="/" className="font-medium text-primary underline-offset-4 hover:underline">
        Back to all tools
      </Link>
    </div>
  </Layout>
);

export default NotFound;
