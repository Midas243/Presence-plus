import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'home': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'rate': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'cp.login': { paramsTuple?: []; params?: {} }
    'cp.login.store': { paramsTuple?: []; params?: {} }
    'cp.dashboard': { paramsTuple?: []; params?: {} }
    'cp.sessions.create': { paramsTuple?: []; params?: {} }
    'cp.sessions.store': { paramsTuple?: []; params?: {} }
    'cp.sessions.attendances.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cp.sessions.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cp.sessions.export': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cp.logout': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'rate': { paramsTuple?: []; params?: {} }
    'cp.login': { paramsTuple?: []; params?: {} }
    'cp.dashboard': { paramsTuple?: []; params?: {} }
    'cp.sessions.create': { paramsTuple?: []; params?: {} }
    'cp.sessions.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cp.sessions.export': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'rate': { paramsTuple?: []; params?: {} }
    'cp.login': { paramsTuple?: []; params?: {} }
    'cp.dashboard': { paramsTuple?: []; params?: {} }
    'cp.sessions.create': { paramsTuple?: []; params?: {} }
    'cp.sessions.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cp.sessions.export': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'cp.login.store': { paramsTuple?: []; params?: {} }
    'cp.sessions.store': { paramsTuple?: []; params?: {} }
    'cp.sessions.attendances.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cp.logout': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}