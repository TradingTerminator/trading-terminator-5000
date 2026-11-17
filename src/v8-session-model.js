/* V8.10 lifecycle decisions shared by routing and acceptance tests. */
(function(root){
 const model={
  confirmed(session){const c=session?.htf_context;return !!(c?.htf_v8?.id||(c?.notes&&Object.keys(c.preflight_checks||{}).length>=4&&Object.values(c.preflight_checks).every(Boolean)));},
  state(session,now=Date.now()){if(!session||session.status!=='open')return 'none';if(!this.confirmed(session))return 'preparing';const end=Date.parse(session.htf_context?.htf_v8?.plan?.personal_plan?.end_at);return Number.isFinite(end)&&now>=end?'expired':'confirmed';},
  legacyStep(n){return ({1:1,2:2,3:2,4:3,5:4})[n]||1;},
  limitIdentity(kind,goal){return kind+':'+(kind==='time'?goal.end_at:[goal.scope,kind.startsWith('loss')?goal.loss_limit:goal.profit_goal].join(':'));},
  pauseTarget(origin,owner,session){return origin?.owner===owner&&origin.session===(session?.id||null)&&(!session||session.status==='open')?origin.route:'live';}
 };
 root.TTSession810=model;if(typeof module!=='undefined')module.exports=model;
})(typeof globalThis!=='undefined'?globalThis:this);
