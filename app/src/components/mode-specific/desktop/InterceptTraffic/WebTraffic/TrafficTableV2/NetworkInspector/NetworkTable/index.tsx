import React, { useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { actions } from "store";
import { getIsTrafficTableTourCompleted, getIsConnectedAppsTourCompleted } from "store/selectors";
import { Table } from "@devtools-ds/table";
import _ from "lodash";
import { getColumnKey } from "../utils";
import { VirtualTable } from "./VirtualTable";
import AppliedRules from "../../Tables/columns/AppliedRules";
import { ProductWalkthrough } from "components/misc/ProductWalkthrough";
import FEATURES from "config/constants/sub/features";
import { TOUR_TYPES } from "components/misc/ProductWalkthrough/constants";
import { useFeatureIsOn } from "@growthbook/growthbook-react";
import VirtualTableV2 from "./VirtualTableV2";
import { APIClient } from "components/common/APIClient";

export const ITEM_SIZE = 30;

interface Props {
  logs: any;
  onRow: Function;
  isStaticPreview: boolean;
}

interface RowData {
  requestShellCurl?: string;
}

const NetworkTable: React.FC<Props> = ({ logs, onRow, isStaticPreview }) => {
  const [selectedRowData, setSelectedRowData] = useState<RowData>({});
  const [isReplayRequestModalOpen, setIsReplayRequestModalOpen] = useState(false);
  const dispatch = useDispatch();
  const isTrafficTableTourCompleted = useSelector(getIsTrafficTableTourCompleted);
  const isConnectedAppsTourCompleted = useSelector(getIsConnectedAppsTourCompleted);

  const isTrafficTableVirtualV2Enabled = useFeatureIsOn("traffic_table_virtualization_v2");

  const onReplayRequest = useCallback(() => {
    setIsReplayRequestModalOpen(true);
  }, []);

  const columns = [
    {
      id: "time",
      title: "Time",
      dataIndex: "timestamp",
      width: "4%",
      render: (timestamp: any) => {
        return new Date(timestamp * 1000).toLocaleTimeString(undefined, {
          hour12: false,
        });
      },
    },
    {
      id: "url",
      title: "URL",
      dataIndex: "url",
      width: "48%",
    },
    {
      id: "method",
      title: "Method",
      dataIndex: ["request", "method"], // corresponds to request.method
      width: "4%",
    },
    {
      id: "contentType",
      title: "Content-Type",
      dataIndex: ["response", "contentType"],
      width: "10%",
    },
    {
      title: "Rules Applied",
      dataIndex: ["actions"],
      width: "10%",
      responsive: ["xs", "sm"],
      hideColumn: isStaticPreview,
      render: (actions: any) => {
        if (!actions || actions === "-" || actions.length === 0) {
          return "-";
        }
        return <AppliedRules actions={actions} />;
      },
    },
    {
      id: "status",
      title: "Status",
      dataIndex: ["response", "statusCode"],
      width: "4%",
    },
  ];

  const renderHeader = () => {
    return (
      <Table.Head style={{ zIndex: 1000 }}>
        <Table.Row>
          {columns.map((column: any) => {
            if (column.hideColumn === true) {
              return null;
            }
            return (
              <Table.HeadCell key={column.id} style={{ width: column.width }}>
                {column.title}
              </Table.HeadCell>
            );
          })}
        </Table.Row>
      </Table.Head>
    );
  };

  const renderLogRow = (log: any, index: number) => {
    if (!log) {
      return null;
    }

    const rowProps = onRow(log);

    return (
      <Table.Row
        key={index}
        id={log.id}
        onContextMenu={() => setSelectedRowData(log)}
        {...rowProps}
        data-tour-id={index === 0 && !isTrafficTableTourCompleted ? "traffic-table-row" : null}
      >
        {columns.map((column: any) => {
          if (column.hideColumn === true) {
            return null;
          }
          const columnData = _.get(log, getColumnKey(column?.dataIndex));

          return <Table.Cell key={column.id}>{column?.render ? column.render(columnData) : columnData}</Table.Cell>;
        })}
      </Table.Row>
    );
  };

  const Row = ({ index, style }: any) => {
    return renderLogRow(logs[index], index);
  };

  const renderTable = () => {
    if (isTrafficTableVirtualV2Enabled) {
      return (
        <VirtualTableV2
          renderHeader={renderHeader}
          renderLogRow={renderLogRow}
          logs={logs}
          selectedRowData={selectedRowData}
          onReplayRequest={onReplayRequest}
        />
      );
    }
    return (
      <VirtualTable
        height="100%"
        width="100%"
        itemCount={logs?.length ?? 0}
        itemSize={ITEM_SIZE}
        header={renderHeader()}
        row={Row}
        footer={null}
        selectedRowData={selectedRowData}
        onReplayRequest={onReplayRequest}
      />
    );
  };

  return (
    <>
      <ProductWalkthrough
        tourFor={FEATURES.DESKTOP_APP_TRAFFIC_TABLE}
        startWalkthrough={!isTrafficTableTourCompleted && isConnectedAppsTourCompleted}
        onTourComplete={() => dispatch(actions.updateProductTourCompleted({ tour: TOUR_TYPES.TRAFFIC_TABLE }))}
      />
      {renderTable()}
      {isReplayRequestModalOpen ? (
        <APIClient
          request={selectedRowData.requestShellCurl}
          openInModal
          modalTitle="Replay request"
          isModalOpen
          onModalClose={() => setIsReplayRequestModalOpen(false)}
        />
      ) : null}
    </>
  );
};

export default NetworkTable;
