
import { Column, RowsUpdateEvent } from 'react-data-grid-temp'

export interface State<T> {
    total: number,
    datas: T[]
    // 一些右键的菜单信息
    contextMenu?: {
        row: T,
        rowIdx: number,
        column: Column<any, unknown>
    },
    groupExpanded: string[],
    // 是否在加载数据
    loading: boolean,
    // 是否全选
    selectAll: boolean,
    // 当前数据页
    pageNo: number
}

export declare type ActionType =
'SET_ADD_ROWS' |
'SET_LOADING' |
'SET_CONTEXTMENU' |
'SET_OP_DATA' |
'SET_UPDATE_ROWS' |
'SET_RELOAD_ROWS' |
'SET_GROUP_EXPANDED'|
'SET_GROUP_EXPANDED_CLEAN'|
'SET_SELECT_ALL';

export type Action<T> = {
    type: ActionType,
    payload?: any
}

export const initialState: State<any> = {
    datas: [],
    total: 0,
    selectAll: false,
    groupExpanded: [],
    loading: false,
    pageNo: 1,
}

const fillOrder = (datas: any[]) => datas.map((ele, index) => ({ $index: index + 1, ...ele }))

// 空方法，拦截当前用户的修改操作
const update = (oldData: any[]) => oldData

export function reducer<T>(state: State<T>, action: Action<T>) {
    const opData: RowsUpdateEvent = action.payload
    const updateData = (rowIndex: number[], callback: (data: T) => T) => {
        const newDatas: T[] = []
        state.datas.forEach((data, index) => {
            let newData = data
            if (rowIndex.indexOf(index) !== -1) {
                newData = callback(data)
            }
            newDatas.push(newData)
        })
        return newDatas
    }

    // 修改数据结果集
    if (action.type === 'SET_ADD_ROWS') {
        const realPayload = action.payload as {
            rows: { total: number, datas: T[]}
        }
        const { rows: { datas, total } } = realPayload
        const rows = {
            datas: update(fillOrder(state.datas.concat(datas))),
            total,
        }

        const pageNo = datas.length > 0 ? state.pageNo + 1 : state.pageNo
        return { ...state, ...rows, loading: false, pageNo };
    }
    if (action.type === 'SET_LOADING') {
        return { ...state, loading: action.payload };
    }
    if (action.type === 'SET_CONTEXTMENU') {
        return { ...state, contextMenu: action.payload }
    }

    // 修改数据结果集
    if (action.type === 'SET_UPDATE_ROWS') {
        return { ...state, datas: update(action.payload) }
    }

    // 重新加载数据
    if (action.type === 'SET_RELOAD_ROWS') {
        const { datas, total } = action.payload
        return {
            ...state,
            datas: fillOrder(datas),
            loading: false,
            pageNo: 2,
            total,
        }
    }

    // 通过拖拽操作数据
    if (action.type === 'SET_OP_DATA') {
        let newDatas = state.datas
        if (opData.action === 'CELL_UPDATE' || opData.action === 'COPY_PASTE') {
            newDatas = updateData([opData.toRow], data => ({ ...data, ...(opData.updated as any) }))
        }

        if (opData.action === 'CELL_DRAG') {
            const cells: number[] = []
            for (let i = opData.fromRow; i <= opData.toRow; i += 1) {
                cells.push(i)
            }
            newDatas = updateData(cells, data => ({ ...data, ...(opData.updated as any) }))
        }
        const rows = {
            total: state.total,
            datas: update(newDatas),
        }

        return { ...state, ...rows }
    }

    // 展开分组
    if (action.type === 'SET_GROUP_EXPANDED') {
        const expanded: string = action.payload
        const groupExpanded: string[] = [...state.groupExpanded]
        const index = groupExpanded.indexOf(expanded)
        if (index !== -1) {
            groupExpanded.splice(index, 1)
        } else {
            groupExpanded.push(expanded)
        }

        return { ...state, groupExpanded }
    }

    if (action.type === 'SET_GROUP_EXPANDED_CLEAN') {
        return { ...state, groupExpanded: [] }
    }
    if (action.type === 'SET_SELECT_ALL') {
        return { ...state, selectAll: action.payload }
    }
    throw new Error(`No corresponding action found - type [${action.type}]`);
}
