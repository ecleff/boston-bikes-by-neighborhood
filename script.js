// Assign the specification to a local variable vlSpec.
var vlSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  description:
    "Though Vega-Lite supports only one scale per axes, one can create a parallel coordinate plot by folding variables, using `joinaggregate` to normalize their values and using ticks and rules to manually create axes.",
  //   load in bikes data
  data: {
    url: "/bikes_parallel_coords.json",
  },
  //   set the border around the graphs to be transparent
  config: {
    view: {
      stroke: "transparent",
    },
  },
  //   vertical concatenation for three graphs
  vconcat: [
    {
      // horizontal concatenation for the text + the circles
      hconcat: [
        {
          transform: [
            //    hard-coding some data transformation to adjust the value at which the dots will be positioned (so it matches the text)
            {
              calculate: "4-(datum.description_pos/1.2)",
              as: "description_pos",
            },
          ],
          //  creating the circles along a vertical y axis, with their opacity and color bound to the 'district_select' bind (which appears later down in the code)
          width: 40,
          height: 500,
          mark: {
            type: "circle",
            size: 1000,
          },
          encoding: {
            y: {
              field: "description_pos",

              type: "quantitative",
              axis: null,
            },
            color: {
              condition: {
                param: "district_select",
                field: "start_district",
                type: "nominal",
                scale: { scheme: "dark2" },
              },
              value: "grey",
            },
            opacity: {
              condition: {
                param: "district_select",
                value: 0.9,
              },
              value: 0.1,
            },
          },
          config: {
            view: {
              stroke: null,
            },
          },
        },
//         creating the text description viz, splitting the text on ! to induce line breaks
        {
          transform: [
            { calculate: "split(datum.description, '!')", as: "description" },
          ],
          width: 740,
          height: 500,
          layer: [
//             the first layer of the vis is the description itself, ideally would have mapped the opacity to the district_select bind but ran into some issues with that
            {
              mark: {
                type: "text",
                limit: 800,
                align: "left",
                dx: -360,
                dy: -70,
                font: "Lato",
                fontSize: 16,
              },
              encoding: {
                y: {
                  aggregate: "min",
                  field: "description_pos",
                  sort: "descending",
                  type: "quantitative",
                  axis: null,
                },
                text: { field: "description", type: "nominal" },

                color: { value: "grey" },
              },
            },
//             the second layer of the vis is the titles (Boston, Brookline, Cambridge, Somerville)
//             color and opacity is bound to the district_select bind
            {
              mark: {
                type: "text",
                limit: 800,
                align: "left",
                dx: -360,
                dy: -90,
                font: "Lato",
                fontSize: 16,
                fontWeight: "bold",
              },

              encoding: {
                y: {
                  aggregate: "min",
                  field: "description_pos",
                  sort: "descending",
                  type: "quantitative",
                  axis: null,
                },
                text: { field: "start_district", type: "nominal" },

                color: {
                  condition: {
                    param: "district_select",
                    field: "start_district",
                    type: "nominal",
                    scale: { scheme: "dark2" },
                  },
                  value: "grey",
                },
                opacity: {
                  condition: {
                    param: "district_select",
                    value: 0.9,
                  },
                  value: 0.1,
                },
              },
            },
          ],
          config: {
            view: {
              stroke: "transparent",
            },
          },
        },
      ],
    },
    {
//       parallel coordinates chart
      width: 800,
      height: 400,
//       performing a data transformation to convert the quantitative variables from wide to long format for mapping
      transform: [
        { filter: "datum['start_hour']" },
        { window: [{ op: "count", as: "index" }] },
        {
          fold: [
            "start_hour",
            "end_hour",
            "tripduration_minutes_cap",
            "end_status",
          ],
        },
        {
          joinaggregate: [
            { op: "min", field: "value", as: "min" },
            { op: "max", field: "value", as: "max" },
          ],
          groupby: ["key"],
        },
        {
          calculate: "(datum.value - datum.min) / (datum.max-datum.min)",
          as: "norm_val",
        },
        {
          calculate: "(datum.min + datum.max) / 2",
          as: "mid",
        },
      ],

      layer: [
        {
//           creating the district_select bind, which allows for the selection of a particular district (mapped to color + opacity for the visualizations)
          params: [
            {
              name: "district_select",
              select: { type: "point", fields: ["start_district"] },
              bind: {
                input: "select",
                options: [
                  null,
                  "Boston",
                  "Brookline",
                  "Cambridge",
                  "Somerville",
                ],
              },
            },
          ],
          mark: { type: "rule", color: "#ccc" },
//           creating the vertical parallel axes
          encoding: {
            detail: { aggregate: "count" },
            x: {
              field: "key",
              type: "nominal",
              sort: [
                "start_hour",
                "tripduration_minutes_cap",
                "end_hour",
                "end_status",
              ],
              title: "",
              axis: {
                labelAngle: 0,
                labelFontSize: 14,
                labelAlign: "left",
                labelExpr:
                  "datum.label =='start_hour'? 'Start Time (Hour)': datum.label == 'end_hour'? 'End Time (Hour)':datum.label == 'tripduration_minutes_cap' ? 'Trip Duration (Minutes)':  'End Location'",
              },
            },
          },
        },
//         creating the horizontal lines with color and opacity mapped to the district_select bind
        {
          mark: "line",
          encoding: {
            color: {
              condition: {
                param: "district_select",
                field: "start_district",
                type: "nominal",
              },
              value: "grey",
            },
            detail: { type: "nominal", field: "index" },
            strokeWidth: {
              condition: { param: "district_select", value: 2 },
              value: 1,
            },
            opacity: {
              condition: {
                param: "district_select",
                value: 0.9,
              },
              value: 0.2,
            },
            x: {
              type: "nominal",
              field: "key",
              type: "nominal",
              sort: [
                "start_hour",
                "tripduration_minutes_cap",
                "end_hour",
                "end_status",
              ],

            },
            y: { type: "quantitative", field: "norm_val", axis: null },
          },
        },
        {
          //   creating the upper vertical limit of the y-axes
          encoding: {
            x: {
              type: "nominal",
              field: "key",
              type: "nominal",
              sort: [
                "start_hour",
                "tripduration_minutes_cap",
                "end_hour",
                "end_status",
              ],
            },
            y: { value: 0 },
          },
          layer: [
            {
              mark: { type: "text", style: "label", align: "right" },
              encoding: {
                text: { aggregate: "max", field: "max" },
              },
            },
            {
              mark: { type: "tick", style: "tick", size: 8, color: "#ccc" },
            },
          ],
        },
        {
          //    creating the middle tick value for the y-axes
          encoding: {
            x: {
              type: "nominal",
              field: "key",
              type: "nominal",
              sort: [
                "start_hour",
                "tripduration_minutes_cap",
                "end_hour",
                "end_status",
              ],
            },
            y: { value: 150 },
          },
          layer: [
            {
              mark: { type: "text", style: "label", align: "right" },
              encoding: {
                text: { aggregate: "min", field: "mid" },
              },
            },
            {
              mark: { type: "tick", style: "tick", size: 8, color: "#ccc" },
            },
          ],
        },
        {
          encoding: {
            x: {
              type: "nominal",
              field: "key",
              type: "nominal",
              sort: [
                "start_hour",
                "tripduration_minutes_cap",
                "end_hour",
                "end_status",
              ],
            },
            y: { value: 300 },
            
          },
          layer: [
            //   creating the bottom labels of the y-axes
            {
              mark: { type: "text", style: "label", align: "right" },
              encoding: {
                text: { aggregate: "min", field: "min" },
              },
            },
            {
              //  bottom y axis ticks
              mark: { type: "tick", style: "tick", size: 8, color: "#ccc" },
            },
          ],
        },
      ],
//       styling for the overall parallel coords visualization
      config: {
        axisX: {
          domain: false,
          labelAngle: 0,
          tickColor: "#ccc",
          title: null,
          type: "nominal",
          sort: [
            "start_hour",
            "end_hour",
            "tripduration_minutes_cap",
            "end_status",
          ],
        },
        view: { stroke: null },
        style: {
          label: { baseline: "middle", align: "right", dx: -5 },
          tick: { orient: "horizontal" },
          color: { scheme: "accent", number: 4 },
        },
        text: { font: "Lato" },
      },
    },
// creating the stacked area diagram that displays the distribution of trip duration times across the 500 rides
    {
      width: 800,
      height: 350,
      mark: "area",
      config: { text: { font: "Lato" } },
      encoding: {
        x: {
          field: "tripduration_minutes_cap",
          axis: { domain: false, tickSize: 5, labelAngle: 0 },
          title: "Trip Duration (Minutes)",
        },
        y: {
          aggregate: "count",
          stack: "center",
          title: "BlueBike Rides (Count)",
          axis: { gridOpacity: 0.3 },
        },
//         mapping color and opacity to the district_select bind
        color: {
          condition: {
            param: "district_select",
            field: "start_district",
            type: "nominal",
            scale: { scheme: "dark2" },
          },
          value: "grey",
        },
        opacity: {
          condition: { param: "district_select", value: 1 },
          value: 0.2,
        },
        stroke: { value: 1 },
        text: { field: "" },
      },
    },
  ],
};

// Embed the visualization in the container with id `vis`
vegaEmbed("#vis", vlSpec);
