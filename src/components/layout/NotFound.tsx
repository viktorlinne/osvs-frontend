type NotFoundProps = {
    title?: string;
    message?: string;
};

export const NotFound = ({
    title = "Not found",
    message = "The requested content was not found.",
}: NotFoundProps) => {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">{title}</h2>
                <p className="text-gray-600">{message}</p>
            </div>
        </div>
    );
};

export default NotFound;
