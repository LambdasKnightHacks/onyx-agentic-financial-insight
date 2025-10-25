export default function AuthCodeError() {
  return (
    <div className="flex h-svh items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Authentication Error
        </h1>
        <p className="text-gray-600 mb-4">
          There was an error during the authentication process.
        </p>
        <a 
          href="/login" 
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Try again
        </a>
      </div>
    </div>
  )
}
