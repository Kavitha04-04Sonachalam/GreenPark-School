import{c as t,h as a}from"./index-D4MTl23B.js";/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o=t("Download",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]]),r=async()=>(await a.get("/api/v1/academic-years")).data,c=async e=>(await a.post("/api/v1/academic-years",e)).data,p=async e=>(await a.put(`/api/v1/academic-years/${e}/activate`)).data,i=async()=>(await a.get("/api/v1/terms")).data,d=async e=>(await a.get("/api/v1/reports/fees-pending",{params:e})).data,y=async e=>(await a.get("/api/v1/reports/fees-payment",{params:e})).data,g=async e=>(await a.get("/api/v1/reports/fees-collection-daily",{params:e})).data,l=async e=>(await a.get("/api/v1/reports/fees-collection-range",{params:e})).data,v=async e=>(await a.get("/api/v1/reports/scholarships",{params:e})).data;export{o as D,i as a,p as b,c,d,y as e,g as f,r as g,l as h,v as i};
