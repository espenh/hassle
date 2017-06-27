import * as React from "react";
import { IEditorContext } from "../contracts";

import MenuItem from "material-ui/MenuItem";
import SelectField from "material-ui/SelectField";
import darkBaseTheme from "material-ui/styles/baseThemes/darkBaseTheme";
import getMuiTheme from "material-ui/styles/getMuiTheme";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import Toggle from "material-ui/Toggle";

export interface IOptionsFrameProps {
    context: IEditorContext;
}

export class OptionsFrame extends React.Component<IOptionsFrameProps, {}> {

    public render(): JSX.Element {
        const styles = {
            block: {
                maxWidth: 250
            },
            toggle: {
                marginBottom: 16
            }
        };

        // TODO - This is just an example of what could be in this options frame.
        // Could also have a outputted-js frame that would change depending on typescript code and typescript output settings (ECMAScript version, etc.).
        // Options would have to be persisted with the other scenario data.

        return <MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}>
            <div style={{ margin: "0 5px" }}>
                <h3>General</h3>
                <div style={styles.block}>
                    <Toggle style={styles.toggle} label="Autorun" title="Automatically generate output on code changes." defaultToggled={true} />
                </div>

                <SelectField floatingLabelText="ECMAScript target">
                    <MenuItem value={1} primaryText="ES 2015" />
                    <MenuItem value={2} primaryText="ES 2016" />
                    <MenuItem value={3} primaryText="ES 2017" />
                    <MenuItem value={4} primaryText="ES 3" />
                    <MenuItem value={5} primaryText="ES 5" />
                </SelectField>
                <h5 style={{ color: "darkred" }}>Note: Options are not implemented yet.</h5>
            </div>
        </MuiThemeProvider>;
    }
}
