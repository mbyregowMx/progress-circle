import { shallow } from "enzyme";
import { DOM, createElement } from "react";

import * as progressbar from "progressbar.js";

import { ProgressCircle, ProgressCircleProps } from "../ProgressCircle";

import { MockContext, mockMendix } from "tests/mocks/Mendix";
import { random } from "faker";

describe("ProgressCircle", () => {

    beforeAll(() => {
        window.mx = mockMendix;
        window.mendix = { lib: { MxContext: MockContext } };
    });

    let progressCircle: progressbar.Circle;
    const render = (props: ProgressCircleProps) => shallow(createElement(ProgressCircle, props));
    const newCircleInstance = (props: ProgressCircleProps) => render(props).instance() as ProgressCircle;
    const Circle = progressbar.Circle;

    const spyOnCircle = () =>
        spyOn(progressbar, "Circle").and.callFake(() =>
            progressCircle = new Circle(document.createElement("div"), {
                strokeWidth: 6,
                trailWidth: 6
            })
        );

    it("renders the structure correctly", () => {
        const progress = render({ value: 60 });

        expect(progress).toBeElement(
            DOM.div({
                className: "widget-progress-circle widget-progress-circle-medium",
                onClick: jasmine.any(Function) as any
            })
        );
    });

    it("creates a progress circle", () => {
        spyOnCircle();
        const progress = newCircleInstance({ value: 80 });

        progress.componentDidMount();

        expect(progressbar.Circle).toHaveBeenCalled();
    });

    it("sets the progress percentage", () => {
        spyOn(progressbar.Circle.prototype, "setText").and.callThrough();
        const setText = progressbar.Circle.prototype.setText as jasmine.Spy;
        spyOnCircle();

        const progress = newCircleInstance({ animate: false, value: 80 });
        progress.componentDidMount();

        expect(setText).toHaveBeenCalled();
    });

    it("updates the progress percentage when the values are changed", () => {
        spyOn(progressbar.Circle.prototype, "setText").and.callThrough();
        const setText = progressbar.Circle.prototype.setText as jasmine.Spy;
        spyOnCircle();

        const progress = newCircleInstance({ value: 80 });
        progress.componentDidMount();
        progress.componentDidUpdate();

        expect(setText).toHaveBeenCalledTimes(2);
    });

    it("destroys progress circle on unmount", () => {
        spyOn(progressbar.Circle.prototype, "destroy").and.callThrough();
        const destroy = progressbar.Circle.prototype.destroy as jasmine.Spy;
        spyOnCircle();

        const progress = newCircleInstance({ value: 80 });
        progress.componentDidMount();
        progress.componentWillUnmount();

        expect(destroy).toHaveBeenCalled();
    });

    it("renders a circle no text when no value is specified", () => {
        spyOnCircle();

        const progress = newCircleInstance({ value: null });
        progress.componentDidMount();

        expect(progressCircle.text.textContent).toBe("--");
    });

    it("renders a circle with the text set to Invalid when the maximum value is less than 1", () => {
        spyOnCircle();

        const progress = newCircleInstance({
            animate: false,
            maximumValue: -1,
            onClickType: "doNothing",
            value: 80
        });
        progress.componentDidMount();

        expect(progressCircle.text.textContent).toBe("Invalid");
    });

    it("renders a circle with negative values when the value is less than 0", () => {
        spyOnCircle();

        const progress = newCircleInstance({ animate: false, value: -1 });
        progress.componentDidMount();

        expect(progressCircle.text.textContent).toBe("-1%");
    });

    it("renders a circle with text greater than 100% when the value is greater than the maximum", () => {
        spyOnCircle();

        const progress = newCircleInstance({ value: 180 });
        progress.componentDidMount();

        expect(progressCircle.text.textContent).toBe("180%");
    });

    it("has the class widget-progress-circle-small when the text size is small", () => {
        const progress = render({ textSize: "small", value: 20 });

        expect(progress.find(".widget-progress-circle-small").length).toBe(1);
    });

    it("has the class widget-progress-circle-medium when the text size is medium", () => {
        const progress = render({ textSize: "medium", value: 20 });

        expect(progress.find(".widget-progress-circle-medium").length).toBe(1);
    });

    it("has the class widget-progress-circle-large when the text size is large", () => {
        const progress = render({ textSize: "large", value: 20 });

        expect(progress.find(".widget-progress-circle-large").length).toBe(1);
    });

    describe("with an onClick microflow set", () => {
        const contextObject: any = {
            getGuid: () => { return random.uuid() },
            getEntity: () => { return random.uuid() }
        };
        const circleProps: ProgressCircleProps = {
            contextObject,
            microflow: "IVK_Onclick",
            onClickType: "callMicroflow",
            value: 20
        };
        it("executes the microflow when a progress Circle is clicked", () => {
            spyOn(window.mx.ui, "action").and.callThrough();

            const progress = render(circleProps);
            console.log(contextObject.getGuid());

            progress.simulate("click");

            expect(window.mx.ui.action).toHaveBeenCalledWith(circleProps.microflow, {
                error: jasmine.any(Function),
                params: {
                    applyto: "selection",
                    guids: [ jasmine.any(String) ]
                }
            });
        });

        it("microflow selected it shows an error in configuration", () => {
            spyOnCircle();
            circleProps.microflow = "";
            spyOn(window.mx.ui, "error").and.callThrough();

            const progress = newCircleInstance(circleProps);
            progress.componentDidMount();

            expect(window.mx.ui.error).toHaveBeenCalledWith("Error in configuration of the progress circle widget" +
                "\n" + "On click microflow is required"
            );
        });

        it("invalid microflow shows an error when a progress circle is clicked", () => {
            const invalidAction = "invalid_action";
            const errorMessage = "Error while executing microflow: invalid_action: mx.ui.action error mock";
            circleProps.microflow = invalidAction;

            spyOn(window.mx.ui, "action").and.callFake((actionname: string, action: { error: (e: Error) => void }) => {
                if (actionname === invalidAction) {
                    action.error(new Error("mx.ui.action error mock"));
                }
            });

            spyOn(window.mx.ui, "error").and.callThrough();

            const progress = render(circleProps);
            progress.simulate("click");

            expect(window.mx.ui.error).toHaveBeenCalledWith(errorMessage);
        });
    });

    describe("with an onClick show page set", () => {
        const contextObject: any = {
            getGuid: () => { return random.uuid() },
            getEntity: () => { return random.uuid() }
        };
        const circleProps: ProgressCircleProps = {
            contextObject,
            onClickType: "showPage",
            page: "showpage.xml",
            pageSettings: "popup",
            value: 20
        };
        it("opens the page when a progress Circle is clicked", () => {
            delete circleProps.microflow;
            spyOn(window.mx.ui, "openForm").and.callThrough();

            const progress = render(circleProps);
            progress.simulate("click");

            expect(window.mx.ui.openForm).toHaveBeenCalledWith(circleProps.page, {
                context: new mendix.lib.MxContext(),
                location: "popup"
            });
        });

        it("without a page selected it shows an error in configuration", () => {
            spyOnCircle();
            circleProps.page = "";
            spyOn(window.mx.ui, "error").and.callThrough();

            const progress = newCircleInstance(circleProps);
            progress.componentDidMount();

            expect(window.mx.ui.error).toHaveBeenCalledWith("Error in configuration of the progress circle widget" +
                "\n" + "On click page is required"
            );
        });
    });

    describe("without a on click", () => {
        const contextObject = jasmine.createSpyObj("contextObject", [ "getGuid", "getEntity" ]);
        const circleProps: ProgressCircleProps = {
            contextObject,
            onClickType: "showPage",
            page: "",
            pageSettings: "popup",
            value: 20
        };
        it("should not respond on user click", () => {
            spyOnCircle();
            spyOn(window.mx.ui, "error");
            spyOn(window.mx.ui, "openForm");
            spyOn(window.mx.ui, "action");

            const progress = render(circleProps);
            progress.simulate("click");

            expect(window.mx.ui.error).not.toHaveBeenCalled();
            expect(window.mx.ui.openForm).not.toHaveBeenCalled();
            expect(window.mx.ui.action).not.toHaveBeenCalled();
        });
    });

    afterAll(() => {
        window.mx = undefined as any;
        window.mendix = undefined as any;
    });
});
