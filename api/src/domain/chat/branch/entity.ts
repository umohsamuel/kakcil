export interface IChatBranch {
  id: string;
  chat_id: string;
  branch_name: string | null;
  branched_from_message_id: string | null;
  branched_from_response_id: string | null;
  is_main_branch: boolean;
  created_at: Date;
}
