import React from "react";
import { Row, Col, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import "./AddCustomScriptRow.css";

const AddCustomScriptRow = ({ rowIndex, helperFunctions }) => {
  const { addEmptyScript } = helperFunctions;

  return (
    <Row className="margin-top-one" key={rowIndex}>
      <Col span={24}>
        <Button
          block
          size="large"
          type="dashed"
          onClick={addEmptyScript}
          icon={<PlusOutlined />}
          className="add-custom-script-btn"
        >
          <span className="text-white">Insert Custom Script</span>
          (scripts are executed serially)
        </Button>
      </Col>
    </Row>
  );
};

export default AddCustomScriptRow;
