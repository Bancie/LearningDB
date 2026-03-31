import { Box, Link, Typography } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

type ChatMarkdownProps = {
  content: string;
  isUser?: boolean;
};

export default function ChatMarkdown({ content, isUser = false }: ChatMarkdownProps) {
  return (
    <Box
      sx={{
        fontSize: "0.9rem",
        lineHeight: 1.55,
        "& p": { my: 0.8 },
        "& ul, & ol": { pl: 2.5, my: 0.8 },
        "& li": { my: 0.3 },
        "& blockquote": {
          borderLeft: "3px solid",
          borderColor: isUser ? "rgba(255,255,255,0.5)" : "primary.main",
          pl: 1.2,
          ml: 0,
          color: isUser ? "inherit" : "text.secondary",
        },
        "& table": {
          borderCollapse: "collapse",
          width: "100%",
          my: 1,
          display: "block",
          overflowX: "auto",
        },
        "& th, & td": {
          border: "1px solid",
          borderColor: isUser ? "rgba(255,255,255,0.4)" : "rgba(15,23,42,0.16)",
          px: 1,
          py: 0.5,
          textAlign: "left",
          whiteSpace: "nowrap",
        },
        "& pre": {
          my: 1,
          p: 1.2,
          overflowX: "auto",
          borderRadius: 1.5,
          bgcolor: isUser ? "rgba(5,16,34,0.35)" : "rgba(15,23,42,0.06)",
        },
        "& code": {
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: "0.82rem",
          borderRadius: 0.8,
        },
        "& :not(pre) > code": {
          bgcolor: isUser ? "rgba(5,16,34,0.4)" : "rgba(15,23,42,0.08)",
          px: 0.6,
          py: 0.18,
        },
        "& h1, & h2, & h3, & h4": {
          mt: 1.2,
          mb: 0.6,
          lineHeight: 1.3,
          fontWeight: 700,
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ href, children }) => (
            <Link
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: isUser ? "inherit" : "primary.main",
                textDecorationThickness: "0.08em",
              }}
            >
              {children}
            </Link>
          ),
          h1: ({ children }) => <Typography variant="h6">{children}</Typography>,
          h2: ({ children }) => <Typography variant="subtitle1">{children}</Typography>,
          h3: ({ children }) => (
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              {children}
            </Typography>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
}
