import React, { Children } from 'react'
import SideNav from '../ui/dashboard/sidenav'

const layout = ({Children} : {Children: React.ReactNode}) => {
    return (
        <div className='flex h-screen flex-col md:flex-row md: overflow-hidden'>
            <div className='w-full flex-none md:w-64'>
                <SideNav/>
            </div>
            <div className='flex-grow p-6 md:overflow-y-auto md:p-12'>
                {Children}
            </div>
        </div>
    )
}

export default layout