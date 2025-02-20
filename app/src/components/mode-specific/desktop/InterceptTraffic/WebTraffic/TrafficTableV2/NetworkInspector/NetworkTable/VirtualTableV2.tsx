import { Table } from "@devtools-ds/table";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ContextMenu } from "../ContextMenu";
import { ITEM_SIZE } from ".";
import { useVirtualizer } from "@tanstack/react-virtual";

import "./virtualTableV2.css";
import { Button } from "antd";
import { ArrowDownOutlined } from "@ant-design/icons";

interface Props {
  logs: any;
  renderHeader: any;
  renderLogRow: any;
  selectedRowData: any;
  onReplayRequest: () => void;
}

const VirtualTableV2: React.FC<Props> = ({
  logs = [],
  renderHeader,
  renderLogRow,
  selectedRowData,
  onReplayRequest,
}) => {
  const [selected, setSelected] = useState(null);
  const [lastKnowBottomIndex, setLastKnownBottomIndex] = useState(null);
  const [isScrollToBottomEnabled, setIsScrollToBottomEnabled] = useState(true);

  const mounted = useRef(false);
  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    // Hack to fix initial mounting lag when given large count @wrongsahil
    count: mounted.current ? logs.length : 100,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_SIZE,
    onChange: (virtualizer) => {
      requestAnimationFrame(() => {
        setIsScrollToBottomEnabled(isListAtBottom());
        if (isListAtBottom()) {
          const items = virtualizer.getVirtualItems();
          setLastKnownBottomIndex(items?.[items.length - 1]?.index);
        }
      });
    },
    // overscan: 15,
  });

  // https://github.com/bvaughn/react-window/issues/60#issuecomment-781540658
  const items = rowVirtualizer.getVirtualItems();
  const paddingTop = items.length > 0 ? items[0].start : 0;
  const paddingBottom = items.length > 0 ? rowVirtualizer.getTotalSize() - items[items.length - 1].end : 0;

  // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight#determine_if_an_element_has_been_totally_scrolled
  const isListAtBottom = () => {
    const LIST_AT_BOTTOM_THRESHOLD = 30;
    const scrollElem = parentRef?.current;

    // Element not found
    if (!scrollElem) {
      return true;
    } else if (
      Math.abs(scrollElem.scrollHeight - scrollElem.clientHeight - scrollElem.scrollTop) < LIST_AT_BOTTOM_THRESHOLD
    ) {
      return true;
    }

    return false;
  };

  const scrollToBottom = useCallback(() => {
    if (logs.length > 0) rowVirtualizer.scrollToIndex(logs.length - 1, { align: "start" });
    // rowVirtualizer.scrollToOffset(rowVirtualizer.getTotalSize(), { align: "start" });
  }, [logs.length, rowVirtualizer]);

  useEffect(() => {
    if (isScrollToBottomEnabled) {
      scrollToBottom();
    }
  }, [scrollToBottom, isScrollToBottomEnabled]);

  const renderNewLogsButton = useCallback(() => {
    if (isScrollToBottomEnabled) {
      return null;
    }

    let buttonText = "New Logs";

    let newLogsCount = 0;
    if (lastKnowBottomIndex) {
      newLogsCount = (logs.length > 0 ? logs.length - 1 : logs.length) - lastKnowBottomIndex;
      buttonText = newLogsCount > 1 ? `${newLogsCount} new logs` : "1 new log";
    }

    if (newLogsCount) {
      return (
        <Button
          type="primary"
          shape="round"
          onClick={scrollToBottom}
          style={{ position: "absolute", bottom: 0, left: "50%" }}
        >
          <ArrowDownOutlined /> {buttonText}
        </Button>
      );
    }

    return null;
  }, [isScrollToBottomEnabled, lastKnowBottomIndex, logs.length, scrollToBottom]);

  // IMP: Keep this in the end to wait for other useEffects to run first
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  return (
    <>
      <div
        ref={parentRef}
        style={{
          height: "100%",
          width: "100%",
          overflow: "auto",
        }}
      >
        <Table
          id="vtable"
          style={
            {
              "--virtualPaddingTop": paddingTop + "px",
              "--virtualPaddingBottom": paddingBottom + "px",
            } as React.CSSProperties
          }
          selected={selected}
          onSelected={(id: string) => {
            setSelected(id);
          }}
          onContextMenu={(e: any) => setSelected(e.target?.parentElement.id)}
        >
          {renderHeader()}
          <ContextMenu log={selectedRowData} onReplayRequest={onReplayRequest}>
            <Table.Body id="vtbody" style={{}}>
              {/* Hack to fix alternate colors flickering due to virtualization*/}
              {rowVirtualizer.getVirtualItems()?.[0]?.index % 2 === 0 ? null : <tr></tr>}

              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const log = logs[virtualRow.index];
                return renderLogRow(log, virtualRow.index);
              })}
            </Table.Body>
          </ContextMenu>
        </Table>
        {renderNewLogsButton()}
      </div>
    </>
  );
};

export default VirtualTableV2;
