import { Typography } from "./components/Typography";
import { Button } from "./index";

function App() {
  return (
    <div>
      <h1>HELLLOOOOO</h1>
      <div className="squid-heading-1">HELLLOOOOO</div>
      <Button type="primary">hello</Button>
      <Typography.Title>你好</Typography.Title>
      <Typography.Title level={2}>你好</Typography.Title>
      <Typography.Title level={3}>你好</Typography.Title>
      <Typography.Title level={4}>你好</Typography.Title>
      <Typography.Title level={5}>你好</Typography.Title>
      <Typography.Text>111</Typography.Text>
      <Typography.Text size="sm">small</Typography.Text>
      <Typography.Text size="base">base</Typography.Text>
      <Typography.Text size="lg">large</Typography.Text>
    </div>
  );
}

export default App;
