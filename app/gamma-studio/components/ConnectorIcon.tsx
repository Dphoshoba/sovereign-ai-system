"use client";

import {
  BadgeCheck,
  Bell,
  CalendarDays,
  Clock,
  Database,
  FileText,
  Folder,
  GitBranch,
  GitFork,
  Hourglass,
  Inbox,
  Mail,
  MessageCircle,
  MessagesSquare,
  Plug,
  Send,
  Share2,
  ShoppingCart,
  Split,
  TimerReset,
} from "lucide-react";

type ConnectorIconProps = {
  id: string;
  className?: string;
};

const ICONS = {
  gmail: Mail,
  calendar: CalendarDays,
  slack: MessageCircle,
  github: GitFork,
  drive: Folder,
  "microsoft-365": Inbox,
  office365: Inbox,
  notion: FileText,
  discord: MessagesSquare,
  stripe: ShoppingCart,
  salesforce: Database,
  hubspot: Send,
  dropbox: Folder,
  onedrive: Folder,
  sharepoint: Share2,
  approval: BadgeCheck,
  trigger: TimerReset,
  decision: GitBranch,
  transform: Split,
  queue: Inbox,
  delay: Hourglass,
  notification: Bell,
  sink: Clock,
} as const;

export function ConnectorIcon({ id, className = "h-4 w-4" }: ConnectorIconProps) {
  const Icon = ICONS[id.toLowerCase() as keyof typeof ICONS] ?? Plug;
  return <Icon aria-hidden="true" className={className} />;
}
