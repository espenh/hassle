import * as React from "react";

import { Dialog, TextField } from "material-ui";
import FlatButton from "material-ui/FlatButton";

interface ISaveDialogProps {
    isOpen: boolean;
    initialValue: string | undefined;
    onSaveRequested: (friendlyName: string | null) => void;
    onRequestClose: () => void;
}

export default class SaveDialog extends React.Component<ISaveDialogProps, {}> {

    private field: TextField | null;

    constructor(props: ISaveDialogProps) {
        super(props);
    }

    private callSaveHandler() {
        const friendlyValue = this.field !== null ? this.field.getValue() : null;
        this.props.onSaveRequested(friendlyValue);
        this.setState({
            open: false
        });
    }

    public render() {

        const actions = [
            <FlatButton
                label="Cancel"
                primary={false}
                keyboardFocused={false}
                onTouchTap={() => {
                    this.props.onRequestClose();
                }}
            />,
            <FlatButton
                label="Save"
                primary={true}
                keyboardFocused={true}
                onTouchTap={() => {
                    this.callSaveHandler();
                }}
            />,
        ];

        return <Dialog
            title="Scenario name"
            actions={actions}
            modal={false}
            open={this.props.isOpen}
            onRequestClose={this.props.onRequestClose}>
            <p>Optionally choose a friendly name for this scenario.</p>
            <span style={{ fontSize: "1.4em", marginRight: "5px", opacity: 0.5 }}>#</span>
            <TextField
                ref={(field) => this.field = field}
                floatingLabelText="Name"
                hintText="SomeFriendlyName"
                onKeyPress={(ev) => {
                    if (ev.key === "Enter") {
                        this.callSaveHandler();
                        ev.preventDefault();
                    }
                }}
                defaultValue={this.props.initialValue}
            />
        </Dialog>;
    }
}
