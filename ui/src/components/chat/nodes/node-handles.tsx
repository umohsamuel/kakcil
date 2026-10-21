import { Handle, Position } from "reactflow";

const handleClass = "opacity-0";

export function TopTarget({ id = "top" }: { id?: string }) {
  return (
    <Handle
      type="target"
      id={id}
      position={Position.Top}
      isConnectable={false}
      className={handleClass}
    />
  );
}

export function LeftTarget() {
  return (
    <Handle
      type="target"
      id="left"
      position={Position.Left}
      isConnectable={false}
      className={handleClass}
    />
  );
}

export function BottomSource() {
  return (
    <Handle
      type="source"
      id="bottom"
      position={Position.Bottom}
      isConnectable={false}
      className={handleClass}
    />
  );
}

export function RightSource() {
  return (
    <Handle
      type="source"
      id="right"
      position={Position.Right}
      isConnectable={false}
      className={handleClass}
    />
  );
}
