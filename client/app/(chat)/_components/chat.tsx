import MessageCard from "@/components/cards/message.card";
import ChatLoading from "@/components/loading/chat.loading";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { messageScheme } from "@/lib/validations";
import { Paperclip, Send, Smile } from "lucide-react";
import { FC, useRef } from "react";
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

interface Props {
  messageForm: UseFormReturn<z.infer<typeof messageScheme>>;
  onSendMessage: (message: z.infer<typeof messageScheme>) => void;
}
const Chat: FC<Props> = ({ messageForm, onSendMessage }) => {
  const { resolvedTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const handleEmojiSelect = (emoji: string) => {
    const input = inputRef.current;
    if (!input) return;

    const text = messageForm.getValues("message");
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;

    const newText = text.slice(0, start) + emoji + text.slice(end);
    messageForm.setValue("message", newText);

    setTimeout(() => {
      input.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };
  return (
    <div className="flex flex-col justify-end z-40 min-h-[92vh]">
      {/* Loading */}
      {/* <ChatLoading /> */}
      {/* Messages */}
      {/* <MessageCard isReceived /> */}
      {/* Start conversation */}
      {/* <div className='w-full h-[88vh] flex items-center justify-center'>
				<div className='text-[100px] cursor-pointer' onClick={() => onSendMessage({ text: '✋' })}>
					✋
				</div>
			</div> */}
      {/* Message input */}
      <Form {...messageForm}>
        <form
          onSubmit={messageForm.handleSubmit(onSendMessage)}
          className="w-full flex relative"
        >
          <Button size={"icon"} type="button" variant={"secondary"}>
            <Paperclip />
          </Button>
          <FormField
            control={messageForm.control}
            name="message"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <Input
                    className="bg-secondary border-l border-l-muted-foreground border-r border-r-muted-foreground h-9"
                    placeholder="Type a message"
                    value={field.value}
                    onBlur={() => field.onBlur()}
                    onChange={(e) => field.onChange(e.target.value)}
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
            <Send />
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default Chat;