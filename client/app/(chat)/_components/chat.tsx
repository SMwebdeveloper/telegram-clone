import MessageCard from "@/components/cards/message.card";
import ChatLoading from "@/components/loading/chat.loading";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { messageSchema } from "@/lib/validation";
import { Paperclip, Send, Smile } from "lucide-react";
import { ChangeEvent, FC, useEffect, useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTheme } from "next-themes";
import { IMessage } from "@/types";
import { useLoading } from "@/hooks/use-loading";
import { useCurrentContact } from "@/hooks/use-current";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { UploadDropzone } from "@/lib/uploadthing";
import { useSession } from "next-auth/react";

interface Props {
  messageForm: UseFormReturn<z.infer<typeof messageSchema>>;
  onSubmitMessage: (message: z.infer<typeof messageSchema>) => Promise<void>;
  onReaction: (reaction: string, messageId: string) => Promise<void>;
  onTyping: (e: ChangeEvent<HTMLInputElement>) => void;
  onDeletedMessage: (messageId: string) => Promise<void>;
  messages: IMessage[];
  onReadMessages: () => Promise<void>;
}
const Chat: FC<Props> = ({
  messageForm,
  onSubmitMessage,
  messages,
  onReadMessages,
  onReaction,
  onTyping,
  onDeletedMessage,
}) => {
  const [open, setOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const scrollRef = useRef<HTMLFormElement | null>(null);
  const { loadMessages, isCreating } = useLoading();
  const { data: session } = useSession();
  const { editMessage, setEditMessage, currentContact } = useCurrentContact();
  const inputRef = useRef<HTMLInputElement | null>(null); 
  const filteredMessages = messages.filter(
    (message) =>
      (message.sender._id === session?.currentUser?._id &&
        message.receiver._id === currentContact?._id) ||
      (message.sender._id === currentContact?._id &&
        message.receiver._id === session?.currentUser?._id)
  );
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    onReadMessages();
  }, [messages]);

  useEffect(() => {
    if (editMessage) {
      messageForm.setValue("text", editMessage.text);
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [editMessage]);
  const handleEmojiSelect = (emoji: string) => {
    const input = inputRef.current;
    if (!input) return;

    const text = messageForm.getValues("text");
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;

    const newText = text.slice(0, start) + emoji + text.slice(end);
    messageForm.setValue("text", newText);

    setTimeout(() => {
      input.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };
  return (
    <div className="flex flex-col justify-end z-40 min-h-[92vh] ">
      {/* Loading */}
      {loadMessages && <ChatLoading />}
      {/* Messages */}
      {filteredMessages.map((message, index) => (
        <MessageCard
          message={message}
          key={index}
          onReaction={onReaction}
          onDeletedMessage={onDeletedMessage}
        />
      ))}
      {/* Start conversation */}
      {filteredMessages.length === 0 && (
        <div className="w-full h-[88vh] flex items-center justify-center">
          <div
            className="text-[100px] cursor-pointer"
            onClick={() => onSubmitMessage({ text: "✋" })}
          >
            ✋
          </div>
        </div>
      )}
      {/* Message input */}
      <Form {...messageForm}>
        <form
          onSubmit={messageForm.handleSubmit(onSubmitMessage)}
          className="w-full flex relative"
          ref={scrollRef}
        >
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size={"icon"} type="button" variant={"secondary"}>
                <Paperclip />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle />
              </DialogHeader>
              <UploadDropzone
                endpoint={"imageUploader"}
                onClientUploadComplete={(res) => {
                  onSubmitMessage({ text: "", image: res[0].url });
                  setOpen(false);
                }}
                config={{ appendOnPaste: true, mode: "auto" }}
              />
            </DialogContent>
          </Dialog>
          <FormField
            control={messageForm.control}
            name="text"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <Input
                    className="bg-secondary border-l border-l-muted-foreground border-r border-r-muted-foreground h-9"
                    placeholder="Type a message"
                    value={field.value}
                    onBlur={() => field.onBlur()}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      onTyping(e);
                      if (e.target.value === "") setEditMessage(null);
                    }}
                    ref={inputRef}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button size={"icon"} type="button" variant={"secondary"}>
                <Smile />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 border-none rounded-md absolute right-6 bottom-0">
              <Picker
                data={data}
                theme={resolvedTheme === "dark" ? "dark" : "light"}
                onEmojiSelect={(emoji: { native: string }) =>
                  handleEmojiSelect(emoji.native)
                }
              />
            </PopoverContent>
          </Popover>
          <Button type="submit" size={"icon"}>
            {isCreating ? <Loader2 className="animate-spin"/> : <Send/>}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default Chat;
