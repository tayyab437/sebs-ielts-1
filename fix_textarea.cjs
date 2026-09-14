const fs = require('fs');
let content = fs.readFileSync('src/components/course-designer/BlockEditor.tsx', 'utf8');

const autoResizeComponent = `
function AutoResizeTextarea(props: React.ComponentProps<typeof Textarea>) {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [props.value]);

  return (
    <Textarea
      {...props}
      ref={ref}
      onInput={(e) => {
        const target = e.target as HTMLTextAreaElement;
        target.style.height = 'auto';
        target.style.height = target.scrollHeight + 'px';
        if (props.onInput) props.onInput(e);
      }}
    />
  );
}
`;

content = content.replace('import RichTextEditor from "../RichTextEditor";', 'import RichTextEditor from "../RichTextEditor";\n' + autoResizeComponent);
content = content.replace(/<Textarea/g, '<AutoResizeTextarea');
content = content.replace(/<\/Textarea>/g, '</AutoResizeTextarea>');

fs.writeFileSync('src/components/course-designer/BlockEditor.tsx', content);
