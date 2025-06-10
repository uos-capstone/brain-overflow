import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
import { useDrag, useDrop } from "react-dnd";
import styles from "../css/ChatWindow.module.css";
import { MyChatMessage } from "./MyChatMessage";
import { OtherChatMessage } from "./OtherChatMessage";
import { EventMessage } from "./EventMessage";
import { MRIMessage } from "./MRIMessage";
import { fetchChats, ChatMessageData, Participant } from "../util/api";
import {
  subscribeToRoomMessages,
  ServerChatMessage,
  sendChatMessage,
} from "../util/socket";
import { NiiFile } from "../util/type";
import { useFileContext } from "../util/fileContext";

/*
interface ChatMessageData {
    messageId: string;
    senderName: string;
    senderId: string;
    content: string;
    timestamp: string;
}
*/

interface DraggedTabItem {
  type: "TAB";
  index: number;
  name: string;
  file: NiiFile;
}

export interface ChatWindowProps {
  id: string;
  title: string;
  x: number;
  y: number;
  zIndex: number;
  isPinned: boolean;
  currentUser: Participant;
  onMove: (id: string, x: number, y: number) => void;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onBringToFront: (id: string) => void;
  onTogglePin: (id: string) => void;
  onOpenSettings: (id: string, buttonElement: HTMLButtonElement) => void;
  onShowParticipantsPanel: (
    id: string,
    buttonElement: HTMLButtonElement
  ) => void;
  children?: React.ReactNode;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  id,
  title,
  x,
  y,
  zIndex,
  isPinned,
  currentUser,
  onMove,
  onClose,
  onMinimize,
  onBringToFront,
  onTogglePin,
  onOpenSettings,
  onShowParticipantsPanel,
}) => {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  //const [loading, setLoading] = useState(true);

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const participantsButtonRef = useRef<HTMLButtonElement>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreOldMessages, setHasMoreOldMessages] = useState(true);
  const [isLoadingOldMessages, setIsLoadingOldMessages] = useState(false);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const isUserAtBottomRef = useRef(true);

  const { setFiles } = useFileContext();

  useEffect(() => {
    const container = messageContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      const bottomGap =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      isUserAtBottomRef.current = bottomGap <= 30; // 30px 이내면 “바닥”
    };

    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!id || !currentUser?.id) {
      return;
    }

    const handleNewServerMessage = (serverMsg: ServerChatMessage) => {
      console.log(
        `[ChatWindow ID: ${id}] handleNewServerMessage 실행됨. 수신된 서버 메시지:`,
        JSON.stringify(serverMsg) // 서버에서 온 원본 메시지 확인
      );

      const newUiMessage: ChatMessageData = {
        messageId: serverMsg.messageId,
        senderId: serverMsg.senderId,
        senderName: serverMsg.senderName,
        content: serverMsg.content,
        timestamp: new Date(serverMsg.timestamp).toLocaleTimeString("ko-KR", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        type: serverMsg.type, // 'CHAT' 또는 'EVENT'
      };

      setMessages((prevMessages) => {
        return [...prevMessages, newUiMessage];
      });
    };

    const unsubscribe = subscribeToRoomMessages(id, handleNewServerMessage);

    return () => {
      unsubscribe();
    };
  }, [id, currentUser]);

  useLayoutEffect(() => {
    // 직전에 “바닥 근처”였던 경우에만 자동 스크롤
    if (isUserAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages]);

  useEffect(() => {
    if (id) {
      setMessages([]);
      setCurrentPage(0);
      setHasMoreOldMessages(true);
      setIsLoadingOldMessages(true);

      fetchChats(id, 0)
        .then((initialMessages) => {
          setMessages(initialMessages);
          if (initialMessages.length === 0) {
            setHasMoreOldMessages(false);
          }
          messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        })
        .catch((error) => {
          console.error(`[ChatWindow ID: ${id}] 초기 메시지 로드 실패:`, error);
          setHasMoreOldMessages(false);
        })
        .finally(() => {
          setIsLoadingOldMessages(false);
        });
    }
    return () => {
      setMessages([]);
      setCurrentPage(0);
      setHasMoreOldMessages(true);
      setIsLoadingOldMessages(false);
    };
  }, [id]);

  const loadPreviousMessages = useCallback(async () => {
    if (!hasMoreOldMessages || isLoadingOldMessages) {
      return;
    }

    setIsLoadingOldMessages(true);
    const nextPage = currentPage + 1;

    try {
      const olderMessages = await fetchChats(id, nextPage);
      if (olderMessages.length > 0) {
        const messageContainer = messageContainerRef.current;
        const previousScrollHeight = messageContainer?.scrollHeight || 0;
        const previousScrollTop = messageContainer?.scrollTop || 0;

        setMessages((prevMessages) => [...olderMessages, ...prevMessages]);
        setCurrentPage(nextPage);
        if (messageContainer) {
          requestAnimationFrame(() => {
            messageContainer.scrollTop =
              messageContainer.scrollHeight -
              previousScrollHeight +
              previousScrollTop;
          });
        }
      } else {
        setHasMoreOldMessages(false);
      }
    } catch (error) {
      console.error(
        `[ChatWindow ID: ${id}] 이전 메시지 로드 실패 (page: ${nextPage}):`,
        error
      );
      setHasMoreOldMessages(false);
    } finally {
      setIsLoadingOldMessages(false);
    }
  }, [id, currentPage, hasMoreOldMessages, isLoadingOldMessages]);

  useEffect(() => {
    const container = messageContainerRef.current;
    const handleScroll = () => {
      if (container && container.scrollTop === 0 && hasMoreOldMessages) {
        loadPreviousMessages();
      }
    };
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [hasMoreOldMessages, loadPreviousMessages]);

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "CHAT_WINDOW",
      item: { id, startX: x, startY: y },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
      end: (item, monitor) => {
        const diff = monitor.getDifferenceFromInitialOffset();
        if (diff && (diff.x !== 0 || diff.y !== 0)) {
          onMove(id, item.startX + diff.x, item.startY + diff.y);
        }
      },
    }),
    [id, x, y, onMove]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLElement && e.target.closest("button, input")) {
      return;
    }
    onBringToFront(id);
  };

  const dynamicWindowStyle: React.CSSProperties = {
    left: x,
    top: y,
    zIndex: zIndex,
    opacity: isDragging ? 0.75 : 1,
  };

  const handleSendMessage = () => {
    const trimmedMessage = inputValue.trim();
    if (trimmedMessage) {
      sendChatMessage(id, trimmedMessage);
      console.log(`[ChatWindow ID: ${id}] 새 메시지 추가됨:`);
      setInputValue("");

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  //   const handleMRIContentClick = (content: string) => {
  //     console.log("MRI클릭", content);
  //   };

  const handleMRIContentClick = async (content: string) => {
    const mriId = content.replace("<MRI>", "").replace(".nii", "").trim(); // 예: "<MRI>3fa8..." → "3fa8..."

    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      // 1. /mri/{mriId} 정보 조회
      const res = await fetch(
        `https://api-brain-overflow.unknownpgr.com/mri/${mriId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "MRI 정보 조회 실패");

      const filePath = json.data.filePath;
      const fileRes = await fetch(
        `https://api-brain-overflow.unknownpgr.com/uploads/${filePath}`
      );
      const blob = await fileRes.blob();
      const file = new File([blob], `${mriId}.nii`, {
        type: "application/octet-stream",
      });

      setFiles((prev) => {
        const alreadyOpen = prev.some((f) => f.name === file.name);
        if (alreadyOpen) {
          return prev.map((f) => ({ ...f, active: f.name === file.name }));
        }
        return prev
          .map((f) => ({ ...f, active: false }))
          .concat({
            name: file.name,
            file,
            active: true,
            age: 0,
            fromRemote: true,
          });
      });
    } catch (err) {
      console.error("🛑 MRI 파일 로딩 실패:", err);
      alert("파일을 불러오지 못했습니다.");
    }
  };

  const headerRef = useRef<HTMLDivElement>(null);
  drag(headerRef);

  const [{ isOver, canDrop }, dropRef] = useDrop<
    DraggedTabItem,
    void,
    { isOver: boolean; canDrop: boolean }
  >({
    accept: "TAB",
    drop: (item) => {
      console.log(item);
      const message = `<MRI>${item.file.name}`;
      sendChatMessage(id, message);
      setMessages((prev) => [
        ...prev,
        {
          messageId: `dropped-${Date.now()}`,
          senderId: currentUser.id,
          senderName: currentUser.nickName,
          content: message,
          timestamp: new Date().toLocaleTimeString("ko-KR", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
          type: "CHAT",
        },
      ]);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const inputAreaRef = useRef<HTMLDivElement>(null);
  dropRef(inputAreaRef);

  return (
    <div
      className={styles.window}
      onMouseDown={handleMouseDown}
      style={dynamicWindowStyle}
    >
      <div ref={headerRef} className={styles.header} style={{ cursor: "move" }}>
        <span className={styles.headerTitle}>{title}</span>
        <div className={styles.headerControls}>
          <button
            ref={participantsButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              if (participantsButtonRef.current) {
                onShowParticipantsPanel(id, participantsButtonRef.current);
              }
            }}
            className={styles.controlButton}
            title="참여자 보기"
          >
            👥
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(id);
            }}
            className={styles.controlButton}
            title={isPinned ? "고정 해제" : "창 고정"}
          >
            {" "}
            {isPinned ? "📍" : "📌"}{" "}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMinimize(id);
            }}
            className={styles.controlButton}
            title="최소화"
          >
            {" "}
            _{" "}
          </button>
          <button
            ref={settingsButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              if (settingsButtonRef.current) {
                onOpenSettings(id, settingsButtonRef.current);
              }
            }}
            className={styles.controlButton}
            title="설정"
          >
            {" "}
            ☰{" "}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose(id);
            }}
            className={styles.controlButton}
            title="닫기"
          >
            {" "}
            ✕{" "}
          </button>
        </div>
      </div>

      <div className={styles.content} ref={messageContainerRef}>
        {messages.map((chat) => {
          switch (chat.type) {
            case "EVENT":
              return <EventMessage key={chat.messageId} chat={chat} />;
            case "CHAT":
              if (chat.content.startsWith("<MRI>")) {
                return (
                  <MRIMessage
                    key={chat.messageId}
                    chat={chat}
                    onClick={handleMRIContentClick}
                  />
                );
              } else if (currentUser && chat.senderId === currentUser.id) {
                return <MyChatMessage key={chat.messageId} chat={chat} />;
              } else {
                return <OtherChatMessage key={chat.messageId} chat={chat} />;
              }
            default:
              console.warn(
                `Unknown message type: ${chat.type} for messageId: ${chat.messageId}`
              );
              return null;
          }
        })}
        <div ref={messagesEndRef} />
      </div>

      <div
        className={styles.inputArea}
        ref={inputAreaRef}
        style={{
          backgroundColor: isOver && canDrop ? "#444" : undefined,
        }}
      >
        <input
          className={styles.inputField}
          placeholder="메시지 입력"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className={styles.sendButton} onClick={handleSendMessage}>
          전송
        </button>
      </div>
    </div>
  );
};
