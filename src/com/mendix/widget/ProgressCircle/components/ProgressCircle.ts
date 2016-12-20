import { Component, DOM, ReactNode } from "react";

import { Circle } from "progressbar.js";

import "../ui/ProgressCircle.css";

export interface OnclickProps {
    onClickType: ProgressOnclick;
    microflowProps?: MicroflowProps;
    pageProps?: PageProps;
}

export interface MicroflowProps {
    microflow: string;
    guid: string;
}

export interface PageProps {
    page: string;
    pageSetting: PageSettings;
    entity: string;
    guid: string;
}

export interface ProgressCircleProps {
    value: number | null;
    maximumValue?: number;
    textSize?: ProgressTextSize;
    animate?: boolean;
    progressOnClick?: OnclickProps;
}

export type ProgressTextSize = "small" | "medium" | "large";
export type ProgressOnclick = "doNothing" | "showPage" | "callMicroflow";
export type PageSettings = "content" | "popup" | "modal";

export class ProgressCircle extends Component<ProgressCircleProps, {}> {
    static defaultProps: ProgressCircleProps = {
        animate: true,
        maximumValue: 100,
        textSize: "medium",
        value: 0
    };
    private progressNode: ReactNode;
    private progressCircle: Circle;

    componentDidMount() {
        this.setProgress(this.props.value, this.props.maximumValue);
        this.checkConfig();
    }

    componentDidUpdate() {
        this.setProgress(this.props.value, this.props.maximumValue);
    }

    render() {
        return DOM.div({
            className: `widget-progress-circle widget-progress-circle-${this.props.textSize}`,
            onClick: () => this.handleOnClick(this.props.progressOnClick),
            ref: node => this.progressNode = node
        });
    }

    componentWillUnmount() {
        this.progressCircle.destroy();
    }

    private createProgressCircle() {
        this.progressCircle = new Circle(this.progressNode, {
            duration: this.props.animate ? 800 : -1,
            strokeWidth: 6,
            trailWidth: 6
        });
        this.progressCircle.path.className.baseVal = "widget-progress-circle-path";
        this.progressCircle.trail.className.baseVal = "widget-progress-circle-trail-path";
    }

    private setProgress(value: number | null, maximum: number = 100) {
        if (!this.progressCircle) {
            this.createProgressCircle();
        }

        let progress = 0;
        let progressText: string;
        if (value === null || typeof value === "undefined") {
            progressText = "";
        } else if (maximum < 1) {
            window.console.warn("The maximum value is less than one. Progress is set to NA");
            progressText = "NA";
        } else {
            progress = Math.round((value / maximum) * 100);
            progressText = progress + "%";
            if (value < 0) {
                progress = 0;
            } else if (value > maximum) {
                progress = 100;
            }
        }

        this.progressCircle.setText(progressText);
        this.progressCircle.animate(progress / 100 || 0);
    }

    private checkConfig() {
        let errorMessage: string[] = [];
        if (this.props.progressOnClick.onClickType === "callMicroflow"
            && !this.props.progressOnClick.microflowProps.microflow) {
            errorMessage.push("'On click' call a microFlow is set " +
                "and there is no 'Microflow' Selected in tab Events");
        }
        if (this.props.progressOnClick.onClickType === "showPage" && !this.props.progressOnClick.pageProps.page) {
            errorMessage.push("'On click' Show a page is set and there is no 'Page' Selected in tab 'Events'");
        }
        if (errorMessage.length > 0) {
            errorMessage.unshift("Error in configuration of the Progress circle widget");
            window.mx.ui.error(errorMessage.join("\n"));
        }
    }

    private handleOnClick(props: OnclickProps) {
        if (props.onClickType === "callMicroflow" && props.microflowProps.microflow && props.microflowProps.guid) {
            window.mx.ui.action(props.microflowProps.microflow, {
                error: error =>
                    window.mx.ui.error(
                        `Error while executing microflow: ${props.microflowProps.microflow}: ${error.message}`
                    ),
                params: {
                    applyto: "selection",
                    guids: [ props.microflowProps.guid ]
                }
            });
        } else if (props.onClickType === "showPage" && props.pageProps.page && props.pageProps.guid) {
            let context = new window.mendix.lib.MxContext();
            context.setTrackId(props.pageProps.guid);
            context.setTrackEntity(props.pageProps.entity);

            window.mx.ui.openForm(props.pageProps.page, {
                context,
                location: props.pageProps.pageSetting
            });
        }
    }
}
