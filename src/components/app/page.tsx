import React from 'react'

const page = ({ children, className }: { children: React.ReactNode, className?: string }) => {

	return (
		<div className={`flex justify-center items-center h-screen ${className}`}>
			{children}
		</div>
	)
}

export default page