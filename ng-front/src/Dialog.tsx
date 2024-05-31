import { useEffect, useRef, useState } from 'react'

export interface DialogListItem {
    title: string;
    handler: (close: () => void) => void
  }

export interface DialogProps {
    listInDialog: DialogListItem[]
    isOpen: boolean
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export const Dialog: React.FC<DialogProps> = (props) =>  {
    const [dialogCursor, setDialogCursor] = useState(0)
    const dialog = useRef<HTMLDialogElement>(null)
    const closeListDialog = () => {
        props.setIsOpen(false)
    }
    useEffect(() => {
        if(props.isOpen){
            dialog.current?.showModal()
        }else{
            dialog.current?.close()
        }
    }, [props.isOpen])

    return <dialog ref={dialog} className="dialog" onKeyDown={(e) => {
        console.log("dialog keydown",e)
        if(e.key == "Enter"){
          props.listInDialog[dialogCursor].handler(closeListDialog)
          e.preventDefault()
        }else if(e.key == "ArrowUp"){
          setDialogCursor(dialogCursor - 1)
        }else if(e.key == "ArrowDown")
          setDialogCursor(dialogCursor + 1)
      }}>
          <h3>test</h3>
          {props.listInDialog?.map((item, i) => <li key={i}>{i==dialogCursor?"*":""}{item.title}</li>)}
      </dialog>
}